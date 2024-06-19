import axios from "axios";
import { useState, useEffect } from "react";

function App() {
  const [jokes, setJokes] = useState([]);

  useEffect(() => {
    axios
      .get("/api/jokes")
      .then((response) => setJokes(response.data))
      .catch((error) => console.log(error));
  }, []);

  return (
    <main className="flex w-full flex-col items-center justify-center p-4 sm:p-16">
      <div className="mb-8 text-4xl text-gray-300">Jokes</div>
      <div>
        {jokes.map((joke, index) => (
          <div key={index} className="my-8">
            {joke.question && joke.answer ? (
              <>
                <div className="font-bold text-sky-300">{joke.question}</div>
                <p className="text-sky-100">{joke.answer}</p>
              </>
            ) : (
              <div className="text-sky-100">{joke.text}</div>
            )}
            <div className="flex flex-row items-center">
              {joke.tags?.map((tag, idx) => (
                <div
                  key={idx}
                  className="my-2 mr-2 rounded-full bg-sky-300 px-2 py-1 font-mono font-bold capitalize"
                >
                  {tag}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

export default App;
