// 日本語フォントを jsPDF に登録する
async function loadJapaneseFont(doc) {
  const fontUrl = "./NotoSansJP-Regular.ttf";

  const fontData = await fetch(fontUrl)
    .then(res => res.arrayBuffer())
    .catch(err => {
      console.error("フォント読み込み失敗:", err);
    });

  if (!fontData) {
    alert("日本語フォントを読み込めませんでした。PDFが文字化けします。");
    return;
  }

  // VFS にフォントを登録
  doc.addFileToVFS("NotoSansJP-Regular.ttf", fontData);
  doc.addFont("NotoSansJP-Regular.ttf", "NotoSansJP", "normal");
}
