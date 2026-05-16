package com.feiraodaorca.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.google.firebase.FirebaseApp;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Força a inicialização nativa do Firebase no Android assim que o app abre
        FirebaseApp.initializeApp(this);
    }
}
