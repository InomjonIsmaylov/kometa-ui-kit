// Files imported `with { loader: 'text' }` arrive as their contents.
declare module '*.html' {
  const text: string;
  export default text;
}
