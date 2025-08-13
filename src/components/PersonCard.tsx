import React from 'react';
import { Link } from 'react-router-dom';
import type { SearchResult } from '../types';

interface PersonCardProps {
  person: SearchResult;
}

const PersonCard: React.FC<PersonCardProps> = ({ person }) => {
  if (person.media_type !== 'person') return null;

  return (
    <Link to={`/person/${person.id}/credits`}>
      <div className="bg-secondary rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
        <div className="aspect-[2/3] relative overflow-hidden">
          {person.profilePath ? (
            <img
              src={person.profilePath}
              alt={person.name}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center">
              <svg className="w-16 h-16 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-lg text-primary mb-2 line-clamp-2">
            {person.name}
          </h3>
          
          {person.knownForDepartment && (
            <p className="text-sm text-secondary mb-2">
              {person.knownForDepartment === 'Acting' ? 'Oyuncu' : person.knownForDepartment}
            </p>
          )}

          {person.knownFor && person.knownFor.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-secondary mb-2">Bilinen İşleri:</p>
              <div className="space-y-1">
                {person.knownFor.slice(0, 3).map((work, index) => (
                  <p key={index} className="text-sm text-primary line-clamp-1">
                    {work.title} ({work.releaseDate ? new Date(work.releaseDate).getFullYear() : 'N/A'})
                  </p>
                ))}
                {person.knownFor.length > 3 && (
                  <p className="text-xs text-secondary">
                    +{person.knownFor.length - 3} diğer iş...
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default PersonCard;
