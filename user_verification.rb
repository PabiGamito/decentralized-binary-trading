require 'bcrypt'

def user_verification(password)
  hash = BCrypt::Password.create(password, :cost => 11)
  return hash == password ? true : false
end
