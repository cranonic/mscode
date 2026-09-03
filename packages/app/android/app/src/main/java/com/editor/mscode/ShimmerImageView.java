package com.editor.mscode;

import android.animation.ValueAnimator;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffXfermode;
import android.graphics.Shader;
import android.util.AttributeSet;

import androidx.appcompat.widget.AppCompatImageView;

/**
 * Splash logo shine/shimmer: sweeps a soft diagonal highlight left → right
 * across only the opaque pixels of the logo (PorterDuff SRC_IN).
 */
public class ShimmerImageView extends AppCompatImageView {

    private Paint shimmerPaint;
    private LinearGradient shimmerGradient;
    private final Matrix gradientMatrix = new Matrix();
    private ValueAnimator animator;
    private float translateX = 0f;

    public ShimmerImageView(Context context) {
        super(context);
        init();
    }

    public ShimmerImageView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    public ShimmerImageView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init();
    }

    private void init() {
        // saveLayer + Xfermode — software layer is the most reliable
        setLayerType(LAYER_TYPE_SOFTWARE, null);
        shimmerPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        shimmerPaint.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.SRC_IN));
    }

    @Override
    protected void onSizeChanged(int w, int h, int oldw, int oldh) {
        super.onSizeChanged(w, h, oldw, oldh);
        if (w <= 0 || h <= 0) return;

        int[] colors = {
            Color.argb(0, 255, 255, 255),
            Color.argb(150, 255, 255, 255),
            Color.argb(0, 255, 255, 255)
        };
        float[] positions = {0f, 0.5f, 1f};
        shimmerGradient = new LinearGradient(
            0, 0, w * 0.6f, 0, colors, positions, Shader.TileMode.CLAMP);
        shimmerPaint.setShader(shimmerGradient);

        startShimmer(w);
    }

    private void startShimmer(int w) {
        if (animator != null) animator.cancel();
        animator = ValueAnimator.ofFloat(-w * 1.4f, w * 1.4f);
        animator.setDuration(1600);
        animator.setStartDelay(400);
        animator.setRepeatCount(ValueAnimator.INFINITE);
        animator.setRepeatDelay(1100);
        animator.addUpdateListener(a -> {
            translateX = (float) a.getAnimatedValue();
            invalidate();
        });
        animator.start();
    }

    @Override
    protected void onDraw(Canvas canvas) {
        if (shimmerGradient == null) {
            super.onDraw(canvas);
            return;
        }

        int layer = canvas.saveLayer(0, 0, getWidth(), getHeight(), null);
        super.onDraw(canvas);

        gradientMatrix.reset();
        gradientMatrix.setRotate(18f, 0, 0);
        gradientMatrix.postTranslate(translateX, 0);
        shimmerGradient.setLocalMatrix(gradientMatrix);

        canvas.drawRect(0, 0, getWidth(), getHeight(), shimmerPaint);
        canvas.restoreToCount(layer);
    }

    @Override
    protected void onDetachedFromWindow() {
        super.onDetachedFromWindow();
        if (animator != null) animator.cancel();
    }
}
