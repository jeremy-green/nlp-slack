import Main from '../components/main';
import Meta from '../components/meta';

export default ({ meta }) => (
  <>
    <Meta {...meta} />
    <Main />
  </>
);

export async function getStaticProps({ params }) {
  const [meta] = await Promise.all([
    fetch('http://localhost:3100/api/meta').then((res) => res.json()),
  ]);
  return { props: { meta } };
}
