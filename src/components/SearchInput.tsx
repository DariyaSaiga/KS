"use client";
import LupaIcon from "../../public/icons/lupa.svg"

export default function SearchInput({ onSearch }: { onSearch: (query: string) => void }){
    return(
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            const query = (e.currentTarget.elements.namedItem("search") as HTMLInputElement).value;
            onSearch(query);
          }}
          className="flex-1 flex"
        >
          <div className="relative flex-1">
            <div className="absolute flex inset-y-0 pl-3 items-center pointer-events-none">
              <LupaIcon className="w-5 h-5 text-gray-400" />
            </div>
            <input 
                type="search"
                name="search"
                placeholder="Search by route name..."
                className="text-inder bg-[#272727] rounded-md w-full h-full pl-10 focus:outline-none focus:ring-1 focus:ring-[#005ECE]"
            />
          </div>
        </form>
    );
};