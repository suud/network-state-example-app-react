import { useState, useMemo, useEffect } from "react";
import Amplify, { Auth } from "aws-amplify";

function getStrongPassword(length, minUpper = 1, minLower = 1, minNumber = 1, minSpecial = 1) {
    let upper = String.fromCharCode(...Array(91).keys()).slice(65), // A-Z
        lower = String.fromCharCode(...Array(123).keys()).slice(97), // a-z
        numbers = String.fromCharCode(...Array(58).keys()).slice(48), // 0-9
        special = String.fromCharCode(...Array(127).keys()).slice(33).replace(/\w/g, ''), // special chars
        all = upper + lower + numbers + special; // all characters
    let minRequired = minSpecial + minUpper + minLower + minNumber;
    let rs = [].concat(
        Array.from({ length: minSpecial ? minSpecial : 0 }, () => special[Math.floor(Math.random() * special.length)]),
        Array.from({ length: minUpper ? minUpper : 0 }, () => upper[Math.floor(Math.random() * upper.length)]),
        Array.from({ length: minLower ? minLower : 0 }, () => lower[Math.floor(Math.random() * lower.length)]),
        Array.from({ length: minNumber ? minNumber : 0 }, () => numbers[Math.floor(Math.random() * numbers.length)]),
        Array.from({ length: Math.max(length, minRequired) - (minRequired ? minRequired : 0) }, () => all[Math.floor(Math.random() * all.length)]),
    );
    return rs.sort(() => Math.random() > 0.5).join('');
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

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
        const passwordLength = getRandomInt(12, 32)
        const password = getStrongPassword(passwordLength);
        const params = {
            username: pubKey,
            password: password,
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