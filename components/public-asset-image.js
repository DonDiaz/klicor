"use client";

export function PublicAssetImage({
  src,
  alt = "",
  className = "",
  fill = false,
  width,
  height,
  loading = "lazy",
  fetchPriority,
  onError,
  style,
  ...props
}) {
  const cleanSrc = String(src || "").trim();
  if (!cleanSrc) return null;

  const imageStyle = fill
    ? {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        ...style,
      }
    : style;

  return (
    <img
      {...props}
      className={className}
      src={cleanSrc}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      decoding="async"
      fetchPriority={fetchPriority}
      style={imageStyle}
      onError={onError}
    />
  );
}
