export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        disallow: ['/backup/', '/admin/', '/internal/exports/'],
      },
    ],
  }
}
