/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: 'Angular Auth OIDC Client Docs',
  tagline: 'Dinosaurs are cool',
  url: 'https://your-docusaurus-test-site.com',
  baseUrl: '/',
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'damienbod', // Usually your GitHub org/user name.
  projectName: 'Angular Auth OIDC Client', // Usually your repo name.
  themeConfig: {
    navbar: {
      title: 'Angular Auth OIDC Client Docs',
      logo: {
        alt: 'My Site Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'doc',
          docId: 'intro',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://github.com/damienbod/angular-auth-oidc-client',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Tutorial',
              to: '/docs/intro',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/damienbod/angular-auth-oidc-client',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Angular Auth OIDC Client Docs, Inc. Built with Docusaurus.`,
    },
    prism: {
      additionalLanguages: ['typescript'],
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          editUrl: 'https://github.com/damienbod/angular-auth-oidc-client',
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          editUrl: 'https://github.com/damienbod/angular-auth-oidc-client',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
};
