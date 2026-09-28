// Notifies IndexNow (Bing, Yandex, Seznam, Naver…) of every URL in the live sitemap.
// Run after a production deploy: `npm run indexnow`
const HOST = 'mijah.fr';
const KEY = '04fadf5d466d34f519e9a95b78627bec'; // served at https://mijah.fr/<KEY>.txt

const sitemap = await (await fetch(`https://${HOST}/sitemap.xml`)).text();
const urlList = [...sitemap.matchAll(/<loc>(https:\/\/mijah\.fr[^<]*)<\/loc>/g)]
  .map((match) => match[1])
  .filter((url) => !url.includes('/photosAndvideos/'));

const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList }),
});

console.log(`IndexNow: submitted ${urlList.length} URLs → HTTP ${response.status}`);
if (!response.ok && response.status !== 202) process.exitCode = 1;
