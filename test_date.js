const last_updated = "2026-09-21T18:43:18.83+00:00";
const isOffline = (new Date() - new Date(last_updated)) > 180000;
console.log("last_updated:", last_updated);
console.log("new Date(last_updated):", new Date(last_updated));
console.log("new Date():", new Date());
console.log("Difference ms:", new Date() - new Date(last_updated));
console.log("isOffline (> 180000):", isOffline);
