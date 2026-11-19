/** Ikon app: telur di atas latar hijau. Dipakai untuk generate PNG. */
export function GambarIkon({ ukuran }: { ukuran: number }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#256338",
      }}
    >
      <div
        style={{
          width: ukuran * 0.42,
          height: ukuran * 0.54,
          borderRadius: "50%",
          background: "#faefd2",
          marginTop: ukuran * 0.02,
        }}
      />
    </div>
  );
}
