import Main from '../components/main';
import Meta from '../components/meta';

export default ({ title, description }) => (
  <>
    <Meta title={title}>
      <meta name="description" content={description} />
    </Meta>
    <Main />
  </>
);

export async function getStaticProps({ params }) {
  const props = await fetch('http://localhost:3100/api/meta').then(res =>
    res.json(),
  );
  return { props };
}
