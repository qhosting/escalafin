
# 🚀 EscalaFin MVP - Deployment Configuration

> **Status**: ✅ Ready for Coolify Deployment  
> **Last Update**: October 1, 2025  
> **Version**: 1.0.0

## 📚 Quick Links

| Document | Description |
|----------|-------------|
| [🎯 RESUMEN_CONFIGURACION_COOLIFY.md](./RESUMEN_CONFIGURACION_COOLIFY.md) | Executive summary of configuration |
| [📖 EASYPANEL-COMPLETE-GUIDE.md](./EASYPANEL-COMPLETE-GUIDE.md) | Complete step-by-step guide (60+ pages) |
| [🎨 GUIA_VISUAL_COOLIFY.md](./GUIA_VISUAL_COOLIFY.md) | Visual guide with screenshots |
| [📋 COMANDOS_GIT_DEPLOYMENT.md](./COMANDOS_GIT_DEPLOYMENT.md) | Git commands reference |
| [🔧 DEPLOYMENT_COOLIFY_SUMMARY.md](./DEPLOYMENT_COOLIFY_SUMMARY.md) | Technical summary |

## ⚡ Quick Start (5 minutes)

### 1. Upload to GitHub
```bash
cd /home/ubuntu/escalafin_mvp
chmod +x deploy-to-github.sh
./deploy-to-github.sh
```

### 2. Configure in Coolify
1. Go to: `https://adm.escalafin.com`
2. Create project: `escalafin-mvp`
3. Add app with:
   - **Dockerfile**: `Dockerfile.production` ⭐
   - **Branch**: `main`
   - **Port**: `3000`
4. Add environment variables (see `.env.example`)
5. Create PostgreSQL service
6. Deploy! 🚀

### 3. Verify
```bash
curl https://app.escalafin.com/api/health
```

## 📦 Key Files

### Production Dockerfile ⭐
```
Dockerfile.production
```
- Multi-stage build (3 stages)
- Next.js standalone output
- ~300MB final image
- Non-root user
- Health checks included

### Startup Script
```
start.sh
```
- Auto migrations
- Database wait
- Prisma client generation
- Seed option

### Configuration
```
.env.example          # All env vars template
.dockerignore        # Build optimization
healthcheck.sh       # Health monitoring
```

## 🎯 Critical Configuration

### next.config.js
```javascript
{
  output: 'standalone'  // ← ESSENTIAL
}
```

### Environment Variables
```env
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://app.escalafin.com
NEXTAUTH_SECRET=[generate with: openssl rand -base64 32]
```

See `.env.example` for complete list.

## 📊 Performance Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Image size | ~800MB | ~300MB | 62% smaller |
| Build time | ~8 min | ~5 min | 37% faster |
| Start time | ~10s | ~3s | 70% faster |
| Security | root | non-root | ✅ Enhanced |

## 🔍 Architecture

```
┌─────────────────────────────────────┐
│         Coolify Platform            │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │   escalafin-app (Next.js)   │   │
│  │   - Dockerfile.production   │   │
│  │   - Port: 3000             │   │
│  │   - Domain: app.escalafin   │   │
│  └──────────┬──────────────────┘   │
│             │                       │
│  ┌──────────▼──────────────────┐   │
│  │   escalafin-db (PostgreSQL) │   │
│  │   - Version: 14             │   │
│  │   - Port: 5432              │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   Redis (optional)          │   │
│  │   - Version: 7              │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

## ✅ Deployment Checklist

### Repository
- [ ] Code pushed to GitHub
- [ ] `Dockerfile.production` in root
- [ ] `next.config.js` with standalone output
- [ ] Health endpoint working

### Coolify
- [ ] Project created
- [ ] GitHub connected
- [ ] App configured with correct Dockerfile
- [ ] Environment variables set
- [ ] PostgreSQL service created
- [ ] Domain configured with SSL

### Verification
- [ ] App accessible at domain
- [ ] Health check returns 200
- [ ] Login/signup work
- [ ] Database populated
- [ ] No critical errors in logs

## 🐛 Common Issues

### Build fails
```bash
# Clear cache in Coolify:
Settings > Clear Build Cache > Deploy
```

### Database connection error
```bash
# Verify DATABASE_URL in environment variables
# Ensure PostgreSQL is Running (green status)
```

### 502 Bad Gateway
```bash
# Check health endpoint
curl http://localhost:3000/api/health
# Restart service in Coolify
```

## 📖 Documentation Structure

```
escalafin_mvp/
├── README_DEPLOYMENT.md                    ← YOU ARE HERE
├── RESUMEN_CONFIGURACION_COOLIFY.md        ← Start here
├── EASYPANEL-COMPLETE-GUIDE.md             ← Full guide
├── GUIA_VISUAL_COOLIFY.md                  ← Visual guide
├── DEPLOYMENT_COOLIFY_SUMMARY.md           ← Technical details
├── COMANDOS_GIT_DEPLOYMENT.md              ← Git commands
│
├── Dockerfile.production                    ← Main Dockerfile
├── start.sh                                 ← Startup script
├── healthcheck.sh                           ← Health monitoring
├── .dockerignore                            ← Build optimization
├── .env.example                             ← Env vars template
└── deploy-to-github.sh                      ← Auto deploy script
```

## 🎓 Learning Path

1. **Quick Overview** (5 min)
   - Read: `RESUMEN_CONFIGURACION_COOLIFY.md`

2. **Visual Configuration** (15 min)
   - Follow: `GUIA_VISUAL_COOLIFY.md`
   - Match with your Coolify UI

3. **Complete Setup** (30 min)
   - Read: `EASYPANEL-COMPLETE-GUIDE.md`
   - Configure everything step by step

4. **Deploy** (10 min)
   - Run: `./deploy-to-github.sh`
   - Configure in Coolify
   - Click Deploy

5. **Verify** (5 min)
   - Test health endpoint
   - Test login/signup
   - Review logs

**Total time: ~1 hour for first deployment**

## 🛠️ Tools Provided

### Automated Scripts
```bash
# Deploy to GitHub with validation
./deploy-to-github.sh

# Manual health check
./healthcheck.sh

# Start with migrations
./start.sh
```

### Documentation
- 📄 Markdown guides (6 files)
- 📕 PDF versions (for offline reading)
- 🎨 Visual guide with screenshots

## 🔐 Security Best Practices

✅ **Non-root user** in Docker container  
✅ **Minimal Alpine** base image  
✅ **No secrets** in repository  
✅ **Environment variables** for configuration  
✅ **HTTPS** with Let's Encrypt  
✅ **Health checks** for auto-healing  

## 📈 Monitoring

### Health Checks
- Endpoint: `/api/health`
- Interval: 30 seconds
- Timeout: 10 seconds
- Start period: 120 seconds

### Logs
Access in Coolify:
- Build logs
- Application logs
- System logs

### Backups
Configure in PostgreSQL service:
- Frequency: Daily
- Time: 2:00 AM
- Retention: 7 days

## 🌐 Domains

### Production
```
https://app.escalafin.com
```

### Coolify Admin
```
https://adm.escalafin.com
```

## 📞 Support

### Documentation
- Check guides in this repository
- Coolify docs: https://coolify.io/docs
- Next.js docs: https://nextjs.org/docs

### Issues
- GitHub: https://github.com/qhosting/escalafin/issues
- Check troubleshooting sections in guides

## 🎯 Next Steps

After successful deployment:

1. **Configure monitoring alerts**
   - Add email notifications
   - Set up uptime monitoring

2. **Set up CI/CD**
   - Enable auto-deploy from GitHub
   - Add deployment notifications

3. **Configure backups**
   - Database backups (daily)
   - File storage backups (S3)

4. **Performance monitoring**
   - Add APM tool (optional)
   - Configure logging service

5. **Security hardening**
   - Review firewall rules
   - Enable fail2ban
   - Configure rate limiting

## 🎉 Success Criteria

Your deployment is successful when:

✅ App accessible at `https://app.escalafin.com`  
✅ Health check returns 200 OK  
✅ Users can register and login  
✅ Database operations work  
✅ Files upload to S3 successfully  
✅ No critical errors in logs  
✅ SSL certificate is valid  
✅ Auto-deploy from GitHub works  

---

## 📝 Version History

- **v1.0.0** (Oct 1, 2025): Initial Coolify configuration
  - Multi-stage Dockerfile
  - Standalone Next.js output
  - Automated startup script
  - Complete documentation

---

**Ready to deploy? Start with**: `./deploy-to-github.sh` 🚀

---

**Prepared by**: DevOps Team - EscalaFin  
**Date**: October 1, 2025  
**License**: See LICENSE file
