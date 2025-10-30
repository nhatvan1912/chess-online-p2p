CREATE DATABASE IF NOT EXISTS chess_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE chess_app;

-- =====================================================
-- Players
-- =====================================================
CREATE TABLE IF NOT EXISTS tblPlayer (
  player_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  displayname VARCHAR(255) DEFAULT NULL,
  status VARCHAR(255) DEFAULT 'offline',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PlayerStats 
-- =====================================================
CREATE TABLE IF NOT EXISTS tblPlayerStats (
  player_id INT PRIMARY KEY,
  games_played INT DEFAULT 0,
  point INT DEFAULT 0,
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  draws INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_playerstats_player FOREIGN KEY (player_id) REFERENCES tblPlayer(player_id) ON DELETE CASCADE,
  INDEX idx_point (point)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Rooms
-- =====================================================
CREATE TABLE IF NOT EXISTS tblRoom (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_code VARCHAR(10) NOT NULL UNIQUE,
  room_name VARCHAR(255) DEFAULT NULL,
  room_type VARCHAR(255) DEFAULT 'public',
  room_mode VARCHAR(255) DEFAULT 'normal',
  status VARCHAR(255) DEFAULT 'waiting',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  password VARCHAR(255) DEFAULT NULL,
  time_initial_sec INT DEFAULT NULL,
  per_move_max_sec INT DEFAULT NULL,
  increment_sec INT DEFAULT NULL,
  host_player_id INT DEFAULT NULL,
  guest_player_id INT DEFAULT NULL,
  host_ready TINYINT(1) DEFAULT 0,
  guest_ready TINYINT(1) DEFAULT 0,
  CONSTRAINT fk_room_host FOREIGN KEY (host_player_id) REFERENCES tblPlayer(player_id) ON DELETE SET NULL,
  CONSTRAINT fk_room_guest FOREIGN KEY (guest_player_id) REFERENCES tblPlayer(player_id) ON DELETE SET NULL,
  INDEX idx_room_code (room_code),
  INDEX idx_room_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Games 
-- =====================================================
CREATE TABLE IF NOT EXISTS tblGame (
  game_id INT AUTO_INCREMENT PRIMARY KEY,
  game_mode VARCHAR(255) DEFAULT 'normal',
  status VARCHAR(255) DEFAULT 'playing',
  result VARCHAR(255) DEFAULT NULL,
  white_point_change INT DEFAULT 0,
  black_point_change INT DEFAULT 0,
  start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP NULL DEFAULT NULL,
  room_id INT DEFAULT NULL,
  white_player_id INT DEFAULT NULL,
  black_player_id INT DEFAULT NULL,
  is_ranked TINYINT(1) DEFAULT 0,
  CONSTRAINT fk_game_room FOREIGN KEY (room_id) REFERENCES tblRoom(id) ON DELETE SET NULL,
  CONSTRAINT fk_game_white_player FOREIGN KEY (white_player_id) REFERENCES tblPlayer(player_id) ON DELETE SET NULL,
  CONSTRAINT fk_game_black_player FOREIGN KEY (black_player_id) REFERENCES tblPlayer(player_id) ON DELETE SET NULL,
  INDEX idx_game_status (status),
  INDEX idx_game_ranked (is_ranked),
  INDEX idx_game_started (start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Game moves 
-- =====================================================
CREATE TABLE IF NOT EXISTS tblGamemove (
  move_id INT AUTO_INCREMENT PRIMARY KEY,
  move_number INT NOT NULL,
  player_color VARCHAR(16) NOT NULL,
  move_notation VARCHAR(255) NOT NULL,
  board_state_fen VARCHAR(255) NOT NULL,
  create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  game_id INT NOT NULL,
  CONSTRAINT fk_move_game FOREIGN KEY (game_id) REFERENCES tblGame(game_id) ON DELETE CASCADE,
  UNIQUE INDEX ux_game_move_number (game_id, move_number),
  INDEX idx_create_at (create_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Trigger: auto-create PlayerStats
-- =====================================================
DELIMITER $$
CREATE TRIGGER after_player_insert
AFTER INSERT ON tblPlayer
FOR EACH ROW
BEGIN
  INSERT INTO tblPlayerStats (player_id) VALUES (NEW.player_id);
END$$
DELIMITER ;
