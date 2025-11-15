const React = require("react-native");
const { StyleSheet } = React;

const styles = StyleSheet.create({
  containerView: {
    flex: 1,
    alignItems: "center",
  },
  loginScreenContainer: {
    flex: 1,
  },
  // NOVO: Container para o Logo e Nome do App
  logoContainer: {
    alignItems: "center",
    marginTop: 100,
    marginBottom: 30,
  },
  // NOVO: Estilo da Imagem do Logo (use uma imagem sua)
  logoImage: {
    width: 100,
    height: 100,
  },
  // NOVO: Estilo para o nome do App
  appName: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 10,
  },
  logoText: { // Estilo original do Instamobile
    fontSize: 40,
    fontWeight: "800",
    marginTop: 150,
    marginBottom: 30,
    textAlign: "center",
  },
  loginFormView: {
    flex: 1,
    paddingHorizontal: 20, // Adicionei padding para não colar nas bordas
  },
  loginFormTextInput: {
    height: 43,
    fontSize: 14,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#eaeaea",
    backgroundColor: "#fafafa",
    paddingLeft: 10,
    marginTop: 5,
    marginBottom: 5,
  },
  loginButton: {
    backgroundColor: "#3897f1",
    borderRadius: 5,
    height: 45,
    marginTop: 10,
    // Removido width fixo para ser mais flexível
    alignItems: "center",
  },
  fbLoginButton: { // Mantido para referência, mas não usado no Login
    height: 45,
    marginTop: 10,
    backgroundColor: 'transparent',
  },
  // NOVO: Estilo para os textos de navegação (ex: "Criar conta")
  navButton: {
    marginTop: 15,
  },
  navButtonText: {
    textAlign: "center",
    color: "#3897f1",
    fontSize: 16,
  },
});
export default styles;