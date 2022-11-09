const username_null = "le nom d'utilisateur ne peut pas être vide";
const username_size =
  "doit avoir un minimum de 5 caractères et un maximum de 12";
const email_null = "l'e-mail ne peut pas être vide";
const email_invalid = "l'email n'est pas valide";
const email_in_use = "email a été utilisé";
const password_null = "le mot de passe ne peut pas être vide";
const password_size = "le mot de passe doit être au moins de 6 caractères";
const password_pattern =
  "le mot de passe doit avoir au moins 1 lettre majuscule, 1 lettre minuscule et 1 chiffre";
const user_create_success = "Utilisateur créé!";

module.exports = {
  username_null,
  username_size,
  email_null,
  email_invalid,
  email_in_use,
  password_null,
  password_size,
  password_pattern,
  user_create_success,
};
