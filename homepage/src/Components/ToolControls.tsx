// @ts-ignore
const ToolControls = ({ newTool, handleNewToolChange, addNewTool, newCategory, setNewCategory, addNewCategory, resetLayout, allCategoriesForDropdown }) => {
  return (
    <div className='mt-24 pt-4 pb-6 hidden sm:block border-t border-b border-theme-border-lighter'>
      <p className='flex leading-tight font-wigrum text-sm pb-2'>add application</p>
      <input
        type="text"
        name="name"
        placeholder="website name"
        value={newTool.name}
        onChange={handleNewToolChange}
        className="border text-sm border-theme-layer-lightest bg-theme-layer-lightest text-theme-text-light rounded-sm px-2 py-1 mr-2"
      />
      <input
        type="text"
        name="website"
        placeholder="website url"
        value={newTool.website}
        onChange={handleNewToolChange}
        className="border text-sm border-theme-layer-lightest bg-theme-layer-lightest text-theme-text-light rounded-sm px-2 py-1 mr-2"
      />
      <input
        type="text"
        name="logo"
        placeholder="logo url"
        value={newTool.logo}
        onChange={handleNewToolChange}
        className="border text-sm border-theme-layer-lightest bg-theme-layer-lightest text-theme-text-light rounded-sm px-2 py-1 mr-2"
      />
      <select
        onChange={handleNewToolChange}
        className='border text-sm mt-4 lg:mt-0 border-theme-layer-lightest bg-theme-layer-lightest text-theme-text-light rounded-sm px-2 py-1 mr-2'
        name="category"
        value={newTool.category}
      >
        <option value="" disabled>select category</option>
        {allCategoriesForDropdown.map((category: any) => (
          <option key={category} value={category}>{category}</option>
        ))}
      </select>
      <button onClick={addNewTool} className="border text-sm border-theme-layer-lightest rounded-sm px-2 py-1 hover:shadow-[1px_1px_0px_#ffffff]">add</button>
      <p className='flex leading-tight font-wigrum text-sm pb-2 pt-4'>add category</p>
      <input
        type="text"
        value={newCategory}
        onChange={(e) => setNewCategory(e.target.value)}
        className="border inline-flex text-sm border-theme-layer-lightest bg-theme-layer-lightest text-theme-text-light rounded-sm px-2 py-1 mr-2"
      />
      <button onClick={addNewCategory} className="inline-flex border text-sm border-theme-layer-lightest rounded-sm px-2 py-1 hover:shadow-[1px_1px_0px_#ffffff]">add</button>
      <div>
        <span className='text-sm inline-flex mt-4'>
          <button
            onClick={resetLayout}
            className='border text-sm border-theme-layer-lightest rounded-sm px-2 py-1 hover:shadow-[1px_1px_0px_#ffffff]'
          >
            reset layout
          </button>
        </span>
      </div>
    </div>
  );
};

export default ToolControls;
