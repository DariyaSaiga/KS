"use client";

import "../app/home.css"

export default function Sorting(){
    return(
        <div className="flex flex-col px-3">
            <h1 className="text-4xl">Sorting</h1>
            <div className="flex flex-col bg-[#272727] rounded-lg py-2 px-2">
                {/* Item 1 */}
                <div className="text-inder flex justify-between">
                    <select className="w-full p-1">
                      <option value="choose">By date of creation</option>
                      <option value="old">from new to old</option>
                      <option value="new">from old to new</option>
                    </select>
                </div>

                {/* Item 2 */}
                <div className="text-inder flex justify-between py-1">
                    <select className="w-full p-1">
                      <option value="choose">By level</option>
                      <option value="5A">5A</option>
                      <option value="5B">5B</option>
                      <option value="5C">5C</option>
                      <option value="6A">6A</option>
                      <option value="6A+">6A+</option>
                      <option value="6B">6B</option>
                      <option value="6B+">6B+</option>
                      <option value="6C">6C</option>
                      <option value="6C+">6C+</option>
                      <option value="7A">7A</option>
                      <option value="7A+">7A+</option>
                      <option value="7B">7B</option>
                      <option value="7B+">7B+</option>
                      <option value="7C">7C</option>
                      <option value="7C+">7C+</option>
                      <option value="8A">8A</option>
                      <option value="8A+">8A+</option>
                      <option value="8B">8B</option>
                      <option value="8B+">8B+</option>
                      <option value="8C">8C</option>
                    </select>
                </div>
                
                {/* Item 3 */}
                <div className="text-inder flex justify-between py-1">
                    <select className="w-full p-1">
                      <option value="choose">By color</option>
                      <option value="old">Red</option>
                      <option value="new">Blue</option>
                      <option value="old">Yellow</option>
                      <option value="new">Green</option>
                      <option value="old">White</option>
                      <option value="new">Black</option>
                      <option value="old">Orange</option>
                      <option value="new">Grey</option>
                    </select>
                </div>
            </div>
        </div>
    );
};