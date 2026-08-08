// docusaurus.config.js

import {themes as prismThemes} from 'prism-react-renderer';
require('dotenv').config();

console.log("Check Env URL:", process.env.SUPABASE_URL ? "LOADED" : "MISSING");
console.log("Check Env Key:", process.env.SUPABASE_ANON_KEY ? "LOADED" : "MISSING");

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'MS Code',
  tagline: 'New Generation Mobile IDE',
  favicon: 'https://i.postimg.cc/BZw7Fk2P/Mono-Studio-Code.png',
  
  // scripts: [
  //   {
  //     src: '/static/custom-api-links.js',
  //     defer: true,
  //   },
  // ],
  
  plugins: [
    () => ({
      name: 'api-proxy',
      configureWebpack() {
        return {
          devServer: {
            proxy: [
              {
                context: ['/api'],
                target: 'http://localhost:3001',
                changeOrigin: true,
              },
            ],
          },
        };
      },
    }),
  ],

  future: {
    v4: true,
    faster: false,
  },

  url: 'https://my-docusaurus-site.example.com',
  baseUrl: '/',
  organizationName: 'cranonic', 
  projectName: 'mscode', 
  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  
  customFields: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          editUrl: 'https://github.com/monostudio-in/mscode',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/docusaurus-social-card.jpg',
      colorMode: {
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: 'Mono Studio',
        logo: {
          alt: 'Mono Studio Logo',
          src: 'https://i.postimg.cc/BZw7Fk2P/Mono-Studio-Code.png',
        },
        items: [
          // ─── Left Side (Desktop) / Top (Mobile) ───
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Documentation',
          },
          {
            to: '/store',
            label: 'Extension Store',
            position: 'left',
          },
          
          // ─── Right Side (Desktop) / Bottom (Mobile) ───
          {
            href: 'https://github.com/monostudio-in/mscode',
            label: 'GitHub',
            position: 'right',
          },
          {
            type: 'custom-authAvatar',
            position: 'right', 
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Resources',
            items: [
              { label: 'Documentation', to: '/docs/intro' },
              { label: 'Extension Store', to: '/store' },
            ],
          },
          {
            title: 'Community',
            items: [
              { label: 'GitHub Repository', href: 'https://github.com/monostudio-org/mscode' },
              { label: 'Report an Issue', href: 'https://github.com/monostudio-in/mscode/issues' },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Mono Studio, Inc. Built with Docusaurus.`, 
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;