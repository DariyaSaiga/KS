"use client";

import { usePathname } from "next/navigation";

import SearchInput from "../components/SearchInput"
import FilterToggle from "../components/FilterToggle"

export default function SearchBar(){
    const pathname = usePathname();
    const title = pathname === "/filter" ? "Filter" : "Routes";

    return(
        <div className="flex flex-col px-3 pb-3">
            <h1 className="flex justify-center text-7xl pt-3 bg-gradient-to-r from-[#FFFFFF] to-[#6C6C6C] bg-clip-text text-transparent">Vassuuup</h1>
            <h1 className="text-4xl">{title}</h1>
            <div className="flex gap-2 mt-2">
              <SearchInput onSearch={(query) => console.log("Поиск по трассам:", query)}/>
              <FilterToggle title={title}/>
            </div>
        </div>
    );
};