package com.example.myapp;

import android.app.Activity;
import android.os.Bundle;
import android.widget.Button;
import android.widget.Toast;

public class MainActivity extends Activity {
  @Override public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    setContentView(R.layout.activity_main);
    findViewById(R.id.primaryButton).setOnClickListener(v -> Toast.makeText(this, "It works!", Toast.LENGTH_SHORT).show());
  }
}
