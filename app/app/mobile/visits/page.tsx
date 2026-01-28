
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';

export default function MobileVisitsPage() {
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    try {
      const response = await fetch('/api/mobile/visits');
      if (response.ok) {
        const data = await response.json();
        setVisits(data.visits);
      }
    } catch (error) {
      console.error('Error fetching visits:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mis Visitas</h1>
          <p className="text-gray-600">Historial de visitas</p>
        </div>
        <Link href="/mobile/visits/new">
          <Button size="sm">Nueva Visita</Button>
        </Link>
      </div>

      <div className="space-y-4">
        {visits.map((visit) => (
          <Card key={visit.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold">
                  {visit.client.firstName} {visit.client.lastName}
                </h3>
                <Badge variant={visit.outcome === 'paid' ? 'default' : 'secondary'}>
                  {visit.outcome || 'Registrada'}
                </Badge>
              </div>

              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(visit.visitDate).toLocaleDateString()}
                </div>
                {visit.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{visit.address}</span>
                  </div>
                )}
                {visit.notes && (
                  <p className="mt-2 text-xs italic">"{visit.notes}"</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {visits.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            No hay visitas registradas
          </div>
        )}
      </div>
    </div>
  );
}
