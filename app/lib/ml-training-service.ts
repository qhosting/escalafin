/**
 * ML Training Service - Entrenamiento Continuo del Modelo de IA
 * 
 * Este servicio maneja:
 * - Recolección de datos de entrenamiento
 * - Reentrenamiento del modelo
 * - Validación de métricas
 * - Activación de nuevas versiones del modelo
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Tipos para el modelo
export interface ModelWeights {
    incomeWeight: number;
    creditScoreWeight: number;
    debtRatioWeight: number;
    employmentWeight: number;
    biasWeight: number;
}

export interface ModelMetrics {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    auc: number;
    confusionMatrix: {
        truePositives: number;
        trueNegatives: number;
        falsePositives: number;
        falseNegatives: number;
    };
}

export interface TrainingFeatures {
    income: number;
    creditScore: number;
    debtRatio: number;
    employmentYears: number;
    paymentsOnTime: number;
    previousDefaults: number;
}

export class MLTrainingService {
    /**
     * Recolecta datos de préstamos completados para entrenamiento
     */
    async collectTrainingData(): Promise<void> {
        // Buscar préstamos que ya fueron completados o tienen estado final
        const completedLoans = await prisma.loan.findMany({
            where: {
                status: {
                    in: ['PAID_OFF', 'DEFAULTED']
                },
                // Préstamos de al menos 30 días de antigüedad
                createdAt: {
                    lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
            },
            include: {
                client: {
                    include: {
                        creditScores: {
                            orderBy: { calculatedAt: 'desc' },
                            take: 1
                        }
                    }
                },
                payments: true
            }
        });

        console.log(`📊 Encontrados ${completedLoans.length} préstamos completados para entrenamiento`);

        for (const loan of completedLoans) {
            // Verificar si ya existe registro de entrenamiento
            const existingData = await prisma.mLTrainingData.findFirst({
                where: {
                    loanId: loan.id
                }
            });

            if (existingData) {
                continue; // Ya procesado
            }

            // Calcular si el préstamo fue exitoso (pagado a tiempo)
            const defaultedPayments = loan.payments.filter(p =>
                p.status === 'FAILED' || p.status === 'CANCELLED'
            ).length;

            const actualOutcome = loan.status === 'PAID_OFF' && defaultedPayments === 0;

            // Obtener el score que se predijo en su momento
            const creditScore = loan.client.creditScores[0];

            if (!creditScore) {
                continue; // No hay score para comparar
            }

            // Características usadas en la predicción
            const features: TrainingFeatures = {
                income: Number(loan.client.monthlyIncome || 0),
                creditScore: creditScore.score,
                debtRatio: Number(loan.principalAmount) / Number(loan.client.monthlyIncome || 1),
                employmentYears: loan.client.yearsEmployed || 0,
                paymentsOnTime: loan.payments.filter(p => p.status === 'COMPLETED').length,
                previousDefaults: 0 // Se puede calcular del historial
            };

            // Guardar datos de entrenamiento
            await prisma.mLTrainingData.create({
                data: {
                    loanId: loan.id,
                    clientId: loan.clientId,
                    predictionScore: creditScore.score,
                    actualOutcome,
                    predictionDate: creditScore.calculatedAt,
                    outcomeDate: new Date(),
                    features: JSON.stringify(features)
                }
            });

            console.log(`✅ Agregado registro de entrenamiento para préstamo ${loan.loanNumber}`);
        }
    }

    /**
     * Entrena un nuevo modelo con los datos recolectados
     */
    async trainNewModel(version: string): Promise<string> {
        console.log(`🧠 Iniciando entrenamiento del modelo ${version}...`);

        // Obtener todos los datos de entrenamiento
        const trainingData = await prisma.mLTrainingData.findMany({
            where: {
                outcomeDate: {
                    not: null
                }
            }
        });

        if (trainingData.length < 10) {
            throw new Error(`Datos insuficientes para entrenar. Se necesitan al menos 10 registros, hay ${trainingData.length}`);
        }

        console.log(`📚 Entrenando con ${trainingData.length} registros`);

        // Preparar datos para entrenamiento
        const X: number[][] = [];
        const y: number[] = [];

        for (const data of trainingData) {
            const features = JSON.parse(data.features) as TrainingFeatures;

            // Normalizar features
            X.push([
                features.income / 100000, // Normalizar ingresos
                features.creditScore / 1000, // Normalizar score
                features.debtRatio,
                features.employmentYears / 10, // Normalizar años
                features.paymentsOnTime / 20 // Normalizar pagos
            ]);

            y.push(data.actualOutcome ? 1 : 0);
        }

        // Algoritmo simple de regresión logística
        const weights = this.trainLogisticRegression(X, y);

        // Calcular métricas del modelo
        const metrics = this.calculateMetrics(X, y, weights);

        // Guardar el modelo
        const model = await prisma.mLModel.create({
            data: {
                version,
                weights: JSON.stringify(weights),
                metrics: JSON.stringify(metrics),
                trainingSize: trainingData.length,
                trainedAt: new Date(),
                notes: `Modelo entrenado con ${trainingData.length} registros. Accuracy: ${(metrics.accuracy * 100).toFixed(2)}%`
            }
        });

        console.log(`✅ Modelo ${version} entrenado exitosamente`);
        console.log(`📊 Métricas:`);
        console.log(`   - Accuracy: ${(metrics.accuracy * 100).toFixed(2)}%`);
        console.log(`   - Precision: ${(metrics.precision * 100).toFixed(2)}%`);
        console.log(`   - Recall: ${(metrics.recall * 100).toFixed(2)}%`);
        console.log(`   - F1 Score: ${(metrics.f1Score * 100).toFixed(2)}%`);

        return model.id;
    }

    /**
     * Algoritmo simple de regresión logística (Gradient Descent)
     */
    private trainLogisticRegression(X: number[][], y: number[], iterations = 1000, learningRate = 0.01): ModelWeights {
        const n = X.length;
        const m = X[0].length;

        // Inicializar pesos
        let weights = Array(m).fill(0);
        let bias = 0;

        // Gradient descent
        for (let iter = 0; iter < iterations; iter++) {
            let gradWeights = Array(m).fill(0);
            let gradBias = 0;

            for (let i = 0; i < n; i++) {
                const z = X[i].reduce((sum, x, j) => sum + x * weights[j], 0) + bias;
                const prediction = 1 / (1 + Math.exp(-z)); // Sigmoid
                const error = prediction - y[i];

                for (let j = 0; j < m; j++) {
                    gradWeights[j] += error * X[i][j];
                }
                gradBias += error;
            }

            // Actualizar pesos
            for (let j = 0; j < m; j++) {
                weights[j] -= (learningRate / n) * gradWeights[j];
            }
            bias -= (learningRate / n) * gradBias;
        }

        return {
            incomeWeight: weights[0] || 0,
            creditScoreWeight: weights[1] || 0,
            debtRatioWeight: weights[2] || 0,
            employmentWeight: weights[3] || 0,
            biasWeight: bias
        };
    }

    /**
     * Calcula métricas del modelo
     */
    private calculateMetrics(X: number[][], y: number[], weights: ModelWeights): ModelMetrics {
        let tp = 0, tn = 0, fp = 0, fn = 0;

        for (let i = 0; i < X.length; i++) {
            const z =
                X[i][0] * weights.incomeWeight +
                X[i][1] * weights.creditScoreWeight +
                X[i][2] * weights.debtRatioWeight +
                X[i][3] * weights.employmentWeight +
                weights.biasWeight;

            const prediction = 1 / (1 + Math.exp(-z));
            const predicted = prediction > 0.5 ? 1 : 0;
            const actual = y[i];

            if (predicted === 1 && actual === 1) tp++;
            else if (predicted === 0 && actual === 0) tn++;
            else if (predicted === 1 && actual === 0) fp++;
            else if (predicted === 0 && actual === 1) fn++;
        }

        const accuracy = (tp + tn) / (tp + tn + fp + fn);
        const precision = tp / (tp + fp) || 0;
        const recall = tp / (tp + fn) || 0;
        const f1Score = 2 * (precision * recall) / (precision + recall) || 0;

        return {
            accuracy,
            precision,
            recall,
            f1Score,
            auc: 0.5 + (accuracy - 0.5) * 0.5, // Aproximación simple
            confusionMatrix: {
                truePositives: tp,
                trueNegatives: tn,
                falsePositives: fp,
                falseNegatives: fn
            }
        };
    }

    /**
     * Activa un modelo específico
     */
    async activateModel(modelId: string): Promise<void> {
        // Desactivar modelo actual
        await prisma.mLModel.updateMany({
            where: { isActive: true },
            data: {
                isActive: false,
                deactivatedAt: new Date()
            }
        });

        // Activar nuevo modelo
        await prisma.mLModel.update({
            where: { id: modelId },
            data: {
                isActive: true,
                activatedAt: new Date()
            }
        });

        console.log(`✅ Modelo ${modelId} activado`);
    }

    /**
     * Obtiene el modelo activo
     */
    async getActiveModel(): Promise<ModelWeights | null> {
        const model = await prisma.mLModel.findFirst({
            where: { isActive: true },
            orderBy: { trainedAt: 'desc' }
        });

        if (!model) {
            return null;
        }

        return JSON.parse(model.weights) as ModelWeights;
    }

    /**
     * Obtiene las métricas de todos los modelos
     */
    async getAllModels() {
        const models = await prisma.mLModel.findMany({
            orderBy: { trainedAt: 'desc' }
        });

        return models.map(model => ({
            ...model,
            weights: JSON.parse(model.weights),
            metrics: JSON.parse(model.metrics)
        }));
    }

    /**
     * Proceso completo de reentrenamiento mensual
     */
    async monthlyRetraining(): Promise<void> {
        console.log('🚀 Iniciando reentrenamiento mensual del modelo...');

        try {
            // 1. Recolectar nuevos datos
            await this.collectTrainingData();

            // 2. Generar número de versión
            const now = new Date();
            const version = `v${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.0`;

            // 3. Entrenar nuevo modelo
            const modelId = await this.trainNewModel(version);

            // 4. Obtener métricas del nuevo modelo
            const newModel = await prisma.mLModel.findUnique({
                where: { id: modelId }
            });

            if (!newModel) {
                throw new Error('Modelo no encontrado después del entrenamiento');
            }

            const newMetrics = JSON.parse(newModel.metrics) as ModelMetrics;

            // 5. Comparar con modelo actual
            const activeModel = await prisma.mLModel.findFirst({
                where: { isActive: true }
            });

            if (activeModel) {
                const activeMetrics = JSON.parse(activeModel.metrics) as ModelMetrics;

                // Solo activar el nuevo modelo si es mejor
                if (newMetrics.accuracy > activeMetrics.accuracy) {
                    await this.activateModel(modelId);
                    console.log(`✅ Nuevo modelo activado - mejor accuracy: ${(newMetrics.accuracy * 100).toFixed(2)}%`);
                } else {
                    console.log(`⚠️  Nuevo modelo no supera al actual. Manteniendo modelo activo.`);
                }
            } else {
                // No hay modelo activo, activar el nuevo
                await this.activateModel(modelId);
                console.log(`✅ Primer modelo activado`);
            }

            console.log('✅ Reentrenamiento mensual completado');
        } catch (error) {
            console.error('❌ Error en reentrenamiento mensual:', error);
            throw error;
        }
    }
}

export const mlTrainingService = new MLTrainingService();
