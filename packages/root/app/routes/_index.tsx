export default function Component() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-12 text-center">
        <h1 className="text-4xl md:text-6xl font-serif tracking-wider mb-16 leading-relaxed">
          「JORGE GALAT」
        </h1>

        <p className="text-xl md:text-3xl tracking-[0.25em] font-serif">
          (SOFTWARE) DEVELOPER
        </p>

        <div className="pt-6 space-y-4 text-lg md:text-xl tracking-[0.5em] font-serif flex flex-col items-center">
          <a
            href="https://github.com/jgalat"
            className="inline-block opacity-80 hover:opacity-100 hover:text-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-opacity-50 transition-all duration-300 relative group py-2 px-4"
          >
            GITHUB
            <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-red-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
          </a>
          <a
            href="https://twitter.com/_jgalat"
            className="inline-block opacity-80 hover:opacity-100 hover:text-orange-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-opacity-50 transition-all duration-300 relative group py-2 px-4"
          >
            TWITTER
            <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
          </a>
          <a
            href="https://linkedin.com/in/jgalat"
            className="inline-block opacity-80 hover:opacity-100 hover:text-blue-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-opacity-50 transition-all duration-300 relative group py-2 px-4"
          >
            LINKEDIN
            <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-blue-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
          </a>
        </div>
      </div>
    </div>
  );
}
