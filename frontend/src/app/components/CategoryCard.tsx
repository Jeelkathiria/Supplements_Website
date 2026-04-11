import { useNavigate } from "react-router-dom";
export const CategoryCard = ({
  category,
}: {
  category: { name: string; image: string };
}) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/products?category=${encodeURIComponent(category.name)}`)}
      className="relative h-72 rounded-2xl overflow-hidden cursor-pointer group shadow-lg hover:shadow-2xl transition-all duration-300"
    >
      {/* Background Image */}
      <img
        src={category.image}
        alt={category.name}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-end pb-8 text-center text-white px-4">
        <h3 className="text-xl font-black mb-4 tracking-wide uppercase drop-shadow-lg">
          {category.name}
        </h3>

        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/products?category=${encodeURIComponent(category.name)}`);
          }}
          className="bg-white text-neutral-900 px-8 py-2.5 rounded-full text-sm font-bold hover:bg-neutral-900 hover:text-white transition-all transform group-hover:translate-y-[-4px] active:scale-95"
        >
          Explore Now
        </button>
      </div>
    </div>
  );
};
