# NFL Picks

Web app for guessing weekly NFL picks

## Local Development

Get dependencies

```
yarn
```

Copy [firebase.config.ts.template](src/resources/firebase.config.ts.template)
firebase configs to [firebase.config.ts](src/resources/firebase.config.ts).

Add firebase configs from Firebase (log in and scroll to the bottom):

<https://console.firebase.google.com/project/nfl-picks-348901/settings/general/web>

Run web app with live loading:

```
yarn start
```

## Toolchain notes

**TypeScript is deliberately held at 5.x.** TypeScript 7 is the native
(Go) compiler rewrite, and the published package ships only the `tsc`
executable -- it has no `main` entry, and `ts.sys` / `ts.createProgram` are
undefined. Every tool that embeds the compiler's JavaScript API therefore
cannot drive it, ts-loader included, which fails at build time with
`TypeError: Cannot read properties of undefined (reading 'fileExists')`.

So `yarn up typescript@latest` will break the build. Moving to 7 means
replacing ts-loader with a transpile-only loader (esbuild-loader or
swc-loader) and running `tsc --noEmit` as a separate type-checking step,
since webpack would no longer type-check on its own.
