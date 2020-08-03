// components/meta.js
import Head from 'next/head';

export default ({ title, description, children }) => (
  <Head>
    <meta charSet="utf-8" />
    <meta name="butt" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    {children}
  </Head>
);
