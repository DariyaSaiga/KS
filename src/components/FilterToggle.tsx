import Link from "next/link";
import FilterIcon from "../../public/icons/filter.svg"
import NotIcon from "../../public/icons/not.svg"

export default function FilterToggle({ title }: { title: string }) {
    const isFilter = title === "Filter";
    return(
        <Link
          href={isFilter ? "/" : "/filter"}
          className="bg-[#003676] inline-flex items-center justify-center rounded-md w-11 h-10"
        >
          {isFilter ? (
            <NotIcon className="p-[1px]" />
          ) : (
            <FilterIcon />
          )}
        </Link>
    );
}