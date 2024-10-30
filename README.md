# Limited Media Server (Site)

This is the WebSite portion of [Limited Media Server](https://github.com/mgatelabs/LimitedMediaServer)

# Getting Started with Limited Media Server (Site)

This guide will help you pull down the source code for [LimitedMediaServerSite](https://github.com/mgatelabs/LimitedMediaServer) and set up your own customized copy if needed.

## 1. Cloning the Repository

To download the code and get started, use Git to clone the repository onto your local machine:

Also you need to download the [Limited Media Server](https://github.com/mgatelabs/LimitedMediaServer) and clone it into the same base directly.

```bash
git clone https://github.com/mgatelabs/LimitedMediaServerSite.git
```

## 2. Building

```bash
cd LimitedMediaServerSite
```

You need to have the NPM package managaer ionstalled in order to build the site.  After you have NPM installed, use base/console and navigate to the LimitedMediaServerSite folder and type the following:

```bash
npm install
```

```bash
ng build
```

If everythong went well, your site has been built to ```../LimitedMediaServer/static```