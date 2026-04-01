cat > /root/shinomontazh-app/server/routes/push.js << 'EOF'
const router = require('express').Router();
const { google } = require('googleapis');

// Сервисный аккаунт
const serviceAccount = {
  type: "service_account",
  project_id: "shinomontazh-push",
  private_key_id: "a04d51c94bf4b653707844e06ac569cb56b24d96",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDTNvyQCQHQieT3\nXzs0VUEdTUUR3qc0qgG5/kAL+0IBBqKx8c9nkZ2DaMWSpXGQMsJu1GC+lwFloa3l\nDtYj3N+dhAOI/HksExyKnWet5fPzVzHWwTMHEt4Td8z49w7c49E6DH917bQrAXg3\nF1KRJ20eomWYR18I5N/xluZdD5yMcDhcqXP1tNxbe14P7Ehp+SAFNOXVK8EeaXpJ\n1ptte6tmgeo1UauNfS5EWf/guXpnhIkA7CF5oqoM9aMzl1bS88YvtnNgBJd3NIzf\neDoXjv4XWs1IlO460G9V1/CDQBqb4tczacgnaE4akNdiMMxlqUET++RR+JUCiash\nTkozYMVfAgMBAAECggEAAYLyOcGmvqxN9Cs9TDmT9ra32NHkFm9lBcS5Bpzssv8u\nKOHXHyGeo/Ma/tqqPmLum0Zvzs1b2DNZADuj8qvA+eqY7+EGqPcWDDPmKwtrPIGS\nPLwzNki/SBpiYCG8fH4w4B54xwpFcM1Y4+QJ1joXANIesgFIv9KLe7oduerDrwmX\nOadnB9tUpEK+87s6kgRdn6sLff0OROnOBiLQc5c8pkHeA+ixLgxKnb6gvK8WNPCK\nMGus2WSkJDHZFeNdZktDOM9wP96HpRz6+k92tGIVeudyesDv3EifLcFASr74SsP7\nyE+LUn2KPv0Wo7ExhMKxtH8T0GYCv6v5/1vGWZ5LSQKBgQDo+0CyhXlLSjkbp2z5\nDX5BcJ6siom4AHB4JFbIjye0FGfwJvJdjhNDF/Kh7q4xwFxNCd3OF6gfihc8SEeP\n4EiHpMGIXNO3rbu+Uot3VtsOdh2GoIA0T9nPskJRy0rXSTdrwOqrKhqHbMx2NQRb\nQHPBMVQPA+4kjdXbdxAlnqoe4wKBgQDoFTHMNrjWnMhrobZGfltoHTpvT8rVR2qT\n6y635q+JVi+pZMZrnXNhmfwedSRzwpZskQ65av2GO+pB8ilpP9Er8cKq+x+sIHce\noW0GhVJOES08uMZV6IRKSDG0jckHbLg4hffx2Vp5bSzWpvzWsndK1ayTi0VPVTGJ\nEYf9nIysVQKBgFpgtS1Lh80EIvkuTqCiclrSZEtMhrYhPX/toNi2Z9F8pQFNKnHO\nXnyFerMEkwBrvaKI9Ekxdh+eAvt4koImoBw2dnj+gYbcV1syTDXkNJ/8g+Gou3MP\nks/2N7HhKcwv89bSBHaXo6jrNLmaQXFgpEbKavBUNvppJw+2tUXSse2/AoGBAMFl\nB/44i4arV4f5Vb8ghGMaGBuxzkA0JufkTyYIIba8DzOFOqNqrT9j5egrjZi5Skhm\nCHMSaPl27BrQBRojh9aqu6FnalkxJJJtykBo0NElFyFGiGAGRlbwGhtvG1oIiurv\nGFJ84RvWkkq9FGyEg0vlCs5YfAVD5OdnqH75+W+RAoGBANbBFrUbfz8+1OqYx9dK\nxiLRBPVPhEfNdByrOptBRC+IBN/Y/Wrkf5DFh24xfNnNWUy6/kRb9lnc9EmzKRCY\nrV7/RS1UvC+MK1JzCvAq4h9mzdEfA+ou8P6Adk4IDLRhN2UcM+PmKImVJfgcvpfI\nGS32qLhXU8LHE8TJ7z/gA4x9\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@shinomontazh-push.iam.gserviceaccount.com",
  client_id: "110445943836354128022",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40shinomontazh-push.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

let firebaseTokens = [];

async function getAccessToken() {
  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccount,
    scopes: ['https://www.googleapis.com/auth/firebase.messaging']
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token;
}

router.post('/subscribe', (req, res) => {
  const { token, type } = req.body;
  if (type === 'firebase' && token) {
    if (!firebaseTokens.includes(token)) {
      firebaseTokens.push(token);
      console.log('✅ Новый токен, всего:', firebaseTokens.length);
    }
  }
  res.json({ success: true });
});

router.post('/send-firebase', async (req, res) => {
  const { title, body, url } = req.body;
  const projectId = serviceAccount.project_id;
  
  try {
    const accessToken = await getAccessToken();
    const results = [];
    
    for (const token of firebaseTokens) {
      try {
        const response = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: {
              token: token,
              notification: {
                title: title || 'Шиномонтаж24',
                body: body || 'Новое предложение!'
              },
              webpush: {
                fcm_options: {
                  link: url || 'https://мастершин24.рф'
                }
              }
            }
          })
        });
        
        const data = await response.json();
        if (response.ok) {
          results.push({ success: true });
        } else {
          results.push({ success: false, error: data.error?.message });
        }
      } catch (err) {
        results.push({ success: false, error: err.message });
      }
    }
    
    res.json({ sent: results.length, total: firebaseTokens.length, results });
  } catch (err) {
    console.error('Ошибка:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats', (req, res) => {
  res.json({ subscribers: firebaseTokens.length });
});

module.exports = router;
EOF