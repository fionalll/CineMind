// Dosya: src/components/UserAvatarCarousel.tsx

import React from 'react';
import { Link } from 'react-router-dom';

interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
}

interface UserAvatarCarouselProps {
  users: User[];
  loading: boolean;
}

const UserAvatarCarousel: React.FC<UserAvatarCarouselProps> = ({ users, loading }) => {
  // Yüklenme durumu için iskelet (skeleton) gösterimi
  if (loading) {
    return (
      <div className="flex space-x-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="text-center">
            <div className="w-16 h-16 bg-background-tertiary rounded-full animate-pulse mx-auto"></div>
            <div className="h-4 bg-background-tertiary rounded w-20 mt-2 animate-pulse"></div>
          </div>
        ))}
      </div>
    );
  }

  // Liste boşsa gösterilecek mesaj
  if (users.length === 0) {
    return <p className="text-sm text-text-secondary">Burada gösterilecek kimse yok.</p>;
  }

  return (
    <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
      {users.map(user => (
        <Link 
          key={user.id}
          to={`/profile/${user.username}`}
          className="flex-shrink-0 w-20 text-center group"
        >
          <img
            src={user.avatar || `https://api.dicebear.com/8.x/initials/svg?seed=${user.displayName}`}
            alt={user.displayName}
            className="w-16 h-16 rounded-full object-cover mx-auto border-2 border-transparent group-hover:border-accent transition-all duration-200"
          />
          <p className="text-xs text-text-secondary mt-2 truncate group-hover:text-text-primary">
            @{user.username}
          </p>
        </Link>
      ))}
    </div>
  );
};

export default UserAvatarCarousel;