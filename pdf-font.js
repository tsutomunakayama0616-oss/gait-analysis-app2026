// pdf-font.js
async function loadJapaneseFont(doc) {
  const fontUrl = "./NotoSansJP-Regular.ttf";  // ← ここが重要
  const fontData = await fetch(fontUrl).then(res => res.arrayBuffer());
  doc.addFileToVFS("NotoSansJP.ttf", fontData);
  doc.addFont("NotoSansJP.ttf", "NotoSansJP", "normal");
}
