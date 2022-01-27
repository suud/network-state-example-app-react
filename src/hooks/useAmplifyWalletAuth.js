import { useState, useMemo, useEffect } from "react";
import Amplify, { Auth } from "aws-amplify";

function useAmplifyWalletAuth(awsconfig) {
    const [user, setUser] = useState(undefined);
    const [token, setToken] = useState(undefined);
    const [error, setError] = useState(undefined);
    const [signingIn, setSigningIn] = useState(false);

    // Configure AWS Amplify authentication resource
    const auth = useMemo(() => {
        Amplify.configure(awsconfig);
        return Auth;
    }, [awsconfig]);

    // Get authenticated user
    useEffect(() => {
        auth.currentAuthenticatedUser()
            .then(currentUser => {
                setUser(currentUser);
                console.log("✅ User is authenticated!");
            })
            .catch(err => {
                setUser(undefined);
                console.log("🛑 Error when trying to get current authenticated user:", err);
            });
        auth.currentSession()
            .then(currentSession => {
                const token = currentSession.getIdToken().getJwtToken();
                setToken(token);
                console.log("✅ Successfully received auth token!");
            })
            .catch(err => {
                setToken(undefined);
                console.log("🛑 Error when trying to get current session:", err);
            });
    }, [auth]);

    // Sign up
    const signUp = (pubKey) => {
        const params = {
            username: pubKey,
            // TODO: create random password
            password: "123abcDEF?",
        };
        return auth.signUp(params);
    }

    const answerAuthChallenge = ({ cognitoUser, signer }) => {
        if (!cognitoUser) {
            console.log("🤔 No cognitoUser given...");
            setSigningIn(false);
            return;
        }
        if (!cognitoUser.challengeParam || !cognitoUser.challengeParam.loginCode) {
            console.log("🤔 No loginCode given...");
            setSigningIn(false);
            return;
        }
        if (user) {
            console.log("🤔 User already authenticated...");
            setSigningIn(false);
            return;
        }

        signer.signMessage(cognitoUser.challengeParam.loginCode)
            .then(answer => {
                auth.sendCustomChallengeAnswer(cognitoUser, answer)
                    .then(authenticatedUser => {
                        // set user and auth token
                        setUser(authenticatedUser);
                        auth.currentSession()
                            .then(currentSession => {
                                const token = currentSession.getIdToken().getJwtToken();
                                setToken(token);
                                console.log("✅ Successfully received auth token!");
                            })
                            .catch(err => {
                                setToken(undefined);
                                console.log("🛑 Error when trying to get current session:", err);
                            });

                        console.log("✅ Successfully answered auth challenge!");
                        setSigningIn(false);
                    })
                    .catch(err => {
                        console.log("🛑 Error when trying to anwer auth challenge:", err);
                        setError(err);
                        setSigningIn(false);
                    });
            })
            .catch(err => {
                console.log("🛑 Error when trying to sign challenge code:", err);
                setError(err);
                setSigningIn(false);
            });
    }

    // Sign in
    const signIn = ({ pubKey, signer }) => {
        if (signingIn) {
            console.log("🤔 Already signing in...");
            return;
        }
        if (!pubKey) {
            console.log("🤔 No pubKey given...");
            return;
        }
        if (!signer) {
            console.log("🤔 No signer given...");
            return;
        }
        if (user) {
            console.log("🤔 User already authenticated...");
            return;
        }

        setSigningIn(true);
        setError(undefined);
        auth.signIn(pubKey)
            .then(cognitoUser => answerAuthChallenge({ cognitoUser, signer }))
            .catch(err => {
                if (err.code !== "UserNotFoundException") {
                    console.log("🛑 Error when trying to sign in:", err);
                    setError(err);
                    setSigningIn(false);
                    return;
                }

                // User does not exist, sign up
                signUp(pubKey)
                    .then(() => {
                        console.log("✅ Successfully signed up!");
                        // User does exist, now
                        // Try to sign in, again
                        auth.signIn(pubKey)
                            .then(cognitoUser => answerAuthChallenge({ cognitoUser, signer }))
                            .catch(err => {
                                console.log("🛑 Error when trying to sign in:", err);
                                setError(err);
                                setSigningIn(false);
                            });
                    })
                    .catch(err => {
                        console.log("🛑 Error when trying to anwer auth challenge:", err);
                        setError(err);
                        setSigningIn(false);
                    });
            });
    }

    // Sign out
    const signOut = () => {
        setUser(undefined);
        setToken(undefined);
        auth.signOut()
            .then(() => console.log("✅ Successfully signed out!"))
            .catch(err => console.log("🛑 Error when trying to sign out:", err));
    };

    return [user, token, signIn, signOut, signingIn, error];
}

export default useAmplifyWalletAuth;