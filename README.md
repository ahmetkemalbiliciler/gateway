**21070006001 Ahmet Kemal Biliciler**

# Bill Payment Gateway - Backend API

Bu proje, **AI destekli fatura ödeme chatbot sistemi** için backend gateway'idir. 

##  Project Links

| Link | URL |
|------|-----|
| **Frontend Source** | https://github.com/ahmetkemalbiliciler/client |
| **Backend Source** | https://github.com/ahmetkemalbiliciler/gateway |
| **Video Presentation** | [Google Drive](https://drive.google.com/file/d/1XXkXrfdhcC1uCRPc-DCDKp2_nWDKHDlW/view?usp=sharing) |
| **Live Demo (Frontend)** | https://client-pq7g.onrender.com/ |
| **Live Demo (Backend)** | https://gateway-77vi.onrender.com/ |
| **API Docs (Swagger)** | https://midterm4458.onrender.com/api-docs/ |

##  Proje Hakkında

Bu gateway, kullanıcının doğal dil mesajlarını anlayıp, harici bir fatura sistemine (Midterm API) bağlanarak işlem yapar.

##  Mimari Tasarım (Design)

```
gateway/
├── src/
│   ├── app.js           # Ana Express sunucusu
│   ├── routes/
│   │   └── chat.js      # Chat endpoint'leri
│   └── services/
│       ├── llm.js       # Gemini AI entegrasyonu
│       └── billSystem.js # Harici API bağlantısı
```

### Neden Bu Yapı?
- **Separation of Concerns**: Route'lar, servisler ve ana uygulama ayrı tutuldu
- **Service Pattern**: LLM ve Bill System ayrı servisler olarak tasarlandı, böylece değiştirmesi kolay
- **Single Responsibility**: Her dosya tek bir iş yapıyor

## Varsayımlar (Assumptions)

1. **Sabit Kullanıcı**: Sistem tek bir kullanıcı (subscriberNo) için çalışır. Gerçek üretimde her kullanıcının kendi session'ı olurdu.
2. **Gemini Yanıt Formatı**: LLM'in her zaman valid JSON döneceğini varsaydık, hatalı durumlar için try-catch ekledik.


## Karşılaşılan Sorunlar (Issues Encountered)

1. **LLM JSON Parsing**: Gemini bazen markdown code block içinde JSON dönüyordu. Bunu temizlemek için regex kullandık:
   ```javascript
   const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
   ```

2. **Intent Belirsizliği**: "Fatura öde" dendiğinde ay bilgisi olmayınca hangi intent'i seçeceğimiz belirsizdi. `NEED_MORE_INFO` intent'i ekledik.

3. **Rate Limiting**: Harici API'de günlük 3 istek limiti vardı. Bu limitin aşıldığını kullanıcıya bildirmek için özel handling ekledik.

## Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Development mode
npm run dev

# Production mode
npm start
```

## Environment Variables

```
GEMINI_API_KEY=your_gemini_api_key
API_USERNAME=admin
PORT=3000
```

## API Endpoints

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/api/chat` | POST | Kullanıcı mesajı gönder, AI yanıtı al |
| `/health` | GET | Sunucu durumu kontrolü |

---

