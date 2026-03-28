export default function ResultCard({ data }) {
  if (!data) return null;

  return (
    <div className="mt-6 p-4 border rounded shadow bg-white">
      <h2 className="text-xl font-bold mb-2">Result</h2>

      <p><strong>Input:</strong> {data.input}</p>
      <p><strong>Cleaned:</strong> {data.cleaned}</p>

      <p><strong>Original Price:</strong> ₹{data.originalPrice}</p>
      <p><strong>Best Alternative:</strong> {data.bestAlternative}</p>
      <p><strong>Best Price:</strong> ₹{data.bestPrice}</p>

      <p className="text-lg">
        <strong>Bias Score:</strong>{" "}
        <span
          className={
            data.biasScore === "High"
              ? "text-red-500"
              : data.biasScore === "Moderate"
              ? "text-yellow-500"
              : "text-green-500"
          }
        >
          {data.biasScore}
        </span>
      </p>

      <p><strong>You Save:</strong> ₹{data.savings}</p>
    </div>
  );
}
