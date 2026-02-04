// ------------------------------------------------------------
// NotoSansJP を jsPDF に登録するフォント定義
// ------------------------------------------------------------

(function (jsPDFAPI) {
  // Base64 で埋め込んだ NotoSansJP-Regular.ttf
  // （約 1.8MB のため圧縮版を使用）
  const font = `
AAEAAAASAQAABAAgR0RFRrRCsIIAAAC8AAAAYGNtYXAW7gkNAAABHAAAAExnYXNwAAAAEAAAAXgA
AAIZ2x5ZlXW2kQAAAGcAAABfGhlYWQF8g0SAAACNAAAADZoaGVhB0IDxAAAArwAAAAkaG10eAAb
AAEAAALQAAAAGGxvY2EBWgAqAAAC/AAAABRtYXhwAAwAFAAAAwQAAAAgbmFtZQKkA1QAAAMwAAAB
fXBvc3QAAwAAAAAEGAAAACBwcmVwAAEAAAAA...（中略）...
`;

  // jsPDF にフォントを追加
  jsPDFAPI.addFileToVFS("NotoSansJP-Regular.ttf", font);
  jsPDFAPI.addFont("NotoSansJP-Regular.ttf", "NotoSansJP", "normal");
})(window.jspdf.jsPDF.API);
