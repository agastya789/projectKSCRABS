import React, { useState } from 'react';
import { User, Edit3, Trophy } from 'lucide-react';
import { PlayerProfile } from '../types/game';
import { useSound } from '../hooks/useSound';

interface UserProfileProps {
  profile: PlayerProfile;
  onUpdateProfile: (profile: PlayerProfile) => void;
}

const avatars = ['👾', '🤖', '👻', '🎮', '🕹️', '💫', '⚡', '🌟'];

export default function UserProfile({ profile, onUpdateProfile }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempUsername, setTempUsername] = useState(profile.username);
  const [tempAvatar, setTempAvatar] = useState(profile.avatar);
  const { playClick } = useSound();

  const handleSave = () => {
    if (tempUsername.trim()) {
      onUpdateProfile({
        ...profile,
        username: tempUsername.trim(),
        avatar: tempAvatar
      });
      setIsEditing(false);
      playClick();
    }
  };

  const handleCancel = () => {
    setTempUsername(profile.username);
    setTempAvatar(profile.avatar);
    setIsEditing(false);
    playClick();
  };

  if (isEditing) {
    return (
      <div className="pixel-panel p-4 mb-6">
        <h3 className="pixel-text text-lg mb-4 text-pixel-green">Edit Profile</h3>
        <div className="space-y-4">
          <div>
            <label className="block pixel-text text-sm mb-2">Username:</label>
            <input
              type="text"
              value={tempUsername}
              onChange={(e) => setTempUsername(e.target.value)}
              className="pixel-input w-full"
              maxLength={12}
              placeholder="Enter username"
            />
          </div>
          <div>
            <label className="block pixel-text text-sm mb-2">Avatar:</label>
            <div className="grid grid-cols-4 gap-2">
              {avatars.map((avatar) => (
                <button
                  key={avatar}
                  onClick={() => setTempAvatar(avatar)}
                  className={`pixel-btn p-2 text-2xl ${
                    tempAvatar === avatar ? 'border-pixel-green' : ''
                  }`}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="pixel-btn pixel-btn-primary flex-1">
              Save
            </button>
            <button onClick={handleCancel} className="pixel-btn flex-1">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pixel-panel p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{profile.avatar}</div>
          <div>
            <h3 className="pixel-text text-lg text-pixel-green">{profile.username}</h3>
            <div className="flex items-center gap-4 text-sm pixel-text text-gray-400">
              <span className="flex items-center gap-1">
                <Trophy size={16} />
                Score: {profile.totalScore.toLocaleString()}
              </span>
              <span>Games: {profile.gamesPlayed}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="pixel-btn p-2"
          title="Edit Profile"
        >
          <Edit3 size={16} />
        </button>
      </div>
    </div>
  );
}