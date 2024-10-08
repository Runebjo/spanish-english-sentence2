import { useState, FormEvent } from 'react';
import axios from 'axios';

interface SearchResult {
  spanish: string;
  english: string;
}

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);

  const handleSearch = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await axios.get(
        `/api/search?query=${encodeURIComponent(query)}`
      );
      setResults(response.data);
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) {
      return text;
    }
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="text-yellow-600">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-gray-800 shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-700">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-300 sm:text-lg sm:leading-7">
                <h2 className="text-3xl font-extrabold text-white">
                  Spanish-English Sentence Search
                </h2>
                <form
                  onSubmit={handleSearch}
                  className="flex items-center border-b border-teal-500 py-2"
                >
                  <input
                    className="appearance-none bg-transparent border-none w-full text-white mr-3 py-1 px-2 leading-tight focus:outline-none placeholder-gray-500"
                    type="text"
                    placeholder="Enter search query"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="flex-shrink-0 bg-teal-500 hover:bg-teal-700 border-teal-500 hover:border-teal-700 text-sm border-4 text-white py-1 px-2 rounded"
                  >
                    Search
                  </button>
                </form>
              </div>
              <div className="pt-6 text-base leading-6 font-bold sm:text-lg sm:leading-7">
                <p className="text-white">Search Results:</p>
                <ul className="list-disc space-y-2 mt-2">
                  {results.map((result, index) => (
                    <li key={index} className="flex flex-col">
                      <span className="text-gray-300">
                        {highlightText(result.spanish, query)}
                      </span>
                      <span className="text-gray-400">
                        {highlightText(result.english, query)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
