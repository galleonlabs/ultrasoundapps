import { XCircleIcon, CheckCircleIcon } from '@heroicons/react/20/solid';
import { classNames } from '../utils/index.tsx';
// @ts-ignore
const ToolItem = ({ tool, toggleVisibility, isVisible, handleToolClick }) => {
  const { id, name, logo, affiliateLink, website } = tool;

  return (
    <div className="relative flex items-center space-x-3 my-1 rounded-sm bg-gradient-to-r from-theme-layer-lighter to-theme-layer-lightest px-1.5 py-1 group hover:shadow-[1px_1px_0px_#ffffff] border border-theme-layer-lightest">
      <div className="flex-shrink-0">
        <img className="h-8 w-8 border border-theme-layer-lightest grayscale-[20%] overflow-hidden rounded-sm" src={logo} alt={name} />
      </div>
      <div className="min-w-0 flex-1">
        <a href={affiliateLink || website} target="_blank" rel="noopener noreferrer" className="focus:outline-none" onClick={() => handleToolClick(name)} >
          <p className="text-sm font-medium text-theme-text-base group-hover:text-white">{name}</p>
        </a>
      </div>
      {isVisible ? (
        <XCircleIcon
          onClick={() => toggleVisibility(id)}
          className={classNames('group flex w-4 h-4 border-0 hover:text-theme-white hover:cursor-pointer items-center justify-center text-theme-layer-base bg-theme-layer-lightest rounded-sm')}
        ></XCircleIcon>
      ) : (
        <CheckCircleIcon
          onClick={() => toggleVisibility(id)}
          className={classNames('group flex w-4 h-4 border-0 hover:text-theme-white hover:cursor-pointer items-center justify-center text-theme-layer-base bg-theme-layer-lightest rounded-sm')}
        ></CheckCircleIcon>
      )}
    </div>
  );
};

export default ToolItem;
