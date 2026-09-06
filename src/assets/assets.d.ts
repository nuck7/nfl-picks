// webpack serves these through asset/resource, so an import yields the emitted
// file's URL. Without these declarations ts-loader fails the import outright --
// TypeScript has no built-in notion of a non-code module.
declare module '*.svg' {
    const url: string
    export default url
}

declare module '*.png' {
    const url: string
    export default url
}
