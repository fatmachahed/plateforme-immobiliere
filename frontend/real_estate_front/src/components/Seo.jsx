import { Helmet } from "react-helmet-async";

const SITE = "https://www.localizi.tn";
const DEFAULT_IMAGE = `${SITE}/og-image.png`;

/**
 * Balises title/description/canonical/OG par page — sans ça, toutes les
 * pages du SPA héritaient du même <title>/<meta description> statiques
 * d'index.html, ce qui empêchait Google de différencier les fiches
 * annonces, les recherches par ville, etc.
 */
export default function Seo({ title, description, path = "", image, noindex = false, jsonLd }) {
  const fullTitle = title ? `${title} | Localizi.tn` : "Localizi – Immobilier Tunisie";
  const url = `${SITE}${path}`;
  const img = image || DEFAULT_IMAGE;
  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex,follow" />}
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={img} />
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
}
