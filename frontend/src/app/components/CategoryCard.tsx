import { useNavigate } from "react-router-dom";
export const CategoryCard = ({
  category,
}: {
  category: { name: string; image: string };
}) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate("/products")}
      className="relative h-72 rounded-2xl overflow-hidden cursor-pointer group"
    >
      {/* Background Image */}
      <img
        src={category.image}
        alt={category.name}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-end pb-8 text-center text-white px-4">
        <h3 className="text-xl font-bold mb-4">
          {category.name}
        </h3>

        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate("/products");
          }}
          className="bg-white text-neutral-900 px-6 py-2 rounded-full text-sm font-medium hover:bg-neutral-200 transition"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
};
