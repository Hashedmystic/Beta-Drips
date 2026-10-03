export default function ImageCredit({ photo }) {
  return (
    <figcaption className="image-credit">
      Photo: <a href={photo.source}>{photo.photographer}</a>
      {' · '}<a href={photo.licenseUrl}>{photo.license}</a>
      {photo.license === 'CC BY-SA 4.0' && <span className="credit-changes">{photo.changes}</span>}
    </figcaption>
  );
}
