/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: 'Angular Auth OIDC Client Docs',
  tagline: 'Angular Auth OIDC Client Docs',
  url: 'https://lively-sand-02e04b010.azurestaticapps.net/',
  baseUrl: '/',
  customFields: {
    redirectOnStart: '/docs/intro',
  },
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'throw',
  favicon: 'img/favicon.ico',
  organizationName: 'damienbod', // Usually your GitHub org/user name.
  projectName: 'Angular Auth OIDC Client', // Usually your repo name.
  markdown: {
    format: 'md',
  },
  themeConfig: {
    navbar: {
      title: 'Angular Auth OIDC Client Docs',
      logo: {
        alt: 'My Site Logo',
        src: 'img/angular-auth-logo.png',
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
        {
          title: 'Made by with ❤',
          items: [
            {
              label: 'Fabian Gosebrink',
              href: 'https://github.com/fabiangosebrink',
            },
            {
              label: 'Damien Bowden',
              href: 'https://github.com/damienbod',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Angular Auth OIDC Client Docs, Inc. Built with Docusaurus.`,
    },
    prism: {
      additionalLanguages: ['typescript', 'bash', 'json'],
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          editUrl:
            'https://github.com/damienbod/angular-auth-oidc-client/edit/main/docs/site/angular-auth-oidc-client',
          remarkPlugins: [
            [require('@docusaurus/remark-plugin-npm2yarn'), { sync: true }],
          ],
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
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
