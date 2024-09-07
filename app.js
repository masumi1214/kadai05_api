const mealForm = document.getElementById('meal-form');
const mealList = document.getElementById('meal-list');
const nutritionInfo = document.getElementById('nutrition-info');
const comparisonInfo = document.getElementById('comparison-info');
const recommendationInfo = document.getElementById('recommendation-info');

// Nutritionix APIキー（サインアップ後に取得）
const apiKey = '1af24506e9a1ff4e523e4fd5fb3ef733';
const appId = '025be489';

// 栄養素の合計値
let meals = [];
let totalCalories = 0;
let totalNutrients = {
    protein: 0,
    fat: 0,
    carbs: 0
};

// AAFCOの基準値 (例)
const aafcoGuidelines = {
    protein: 22, // g
    fat: 8,      // g
    carbs: 45,   // g
    calories: 800 // kcal
};

// Nutritionix APIを使用して食品データを取得
async function getNutritionData(mealName) {
    const response = await fetch(`https://trackapi.nutritionix.com/v2/natural/nutrients`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-app-id': appId,
            'x-app-key': apiKey
        },
        body: JSON.stringify({
            query: mealName,
            timezone: "US/Eastern"
        })
    });

    const data = await response.json();

    if (data.foods && data.foods.length > 0) {
        const food = data.foods[0];
        return {
            energy_value: food.nf_calories,
            proteins_value: food.nf_protein,
            fat_value: food.nf_total_fat,
            carbohydrates_value: food.nf_total_carbohydrate
        };
    } else {
        alert("食材が見つかりません。別の名前を試してください。");
        return null;
    }
}

// 食事をリストに追加し、栄養情報を計算
mealForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const mealName = document.getElementById('meal').value.trim().toLowerCase();
    const quantity = parseFloat(document.getElementById('quantity').value);
    
    if (mealName === "") {
        alert("有効な食材名を入力してください。");
        return;
    }

    const nutritionData = await getNutritionData(mealName);

    if (nutritionData) {
        const calories = (nutritionData.energy_value * quantity) / 100;
        const protein = (nutritionData.proteins_value * quantity) / 100;
        const fat = (nutritionData.fat_value * quantity) / 100;
        const carbs = (nutritionData.carbohydrates_value * quantity) / 100;

        // 栄養情報の計算
        totalCalories += calories;
        totalNutrients.protein += protein;
        totalNutrients.fat += fat;
        totalNutrients.carbs += carbs;

        // 食事リストに追加
        meals.push({ mealName, quantity, calories });
        displayMeals();

        // 栄養情報を表示
        displayNutritionInfo();

        // AAFCO基準との比較
        displayComparisonWithAAFCO();

        // レコメンド機能
        displayRecommendations();
    }
});

// 食事リストを表示
function displayMeals() {
    mealList.innerHTML = '';
    meals.forEach(meal => {
        const li = document.createElement('li');
        li.textContent = `${meal.mealName} - ${meal.quantity}g (${meal.calories.toFixed(2)} kcal)`;
        mealList.appendChild(li);
    });
}

// 栄養情報を表示
function displayNutritionInfo() {
    nutritionInfo.innerHTML = `
        <p>合計カロリー: ${totalCalories.toFixed(2)} kcal</p>
        <p>タンパク質: ${totalNutrients.protein.toFixed(2)} g</p>
        <p>脂質: ${totalNutrients.fat.toFixed(2)} g</p>
        <p>炭水化物: ${totalNutrients.carbs.toFixed(2)} g</p>
    `;
}

// AAFCO基準との比較
function displayComparisonWithAAFCO() {
    const proteinDiff = totalNutrients.protein - aafcoGuidelines.protein;
    const fatDiff = totalNutrients.fat - aafcoGuidelines.fat;
    const carbsDiff = totalNutrients.carbs - aafcoGuidelines.carbs;
    const caloriesDiff = totalCalories - aafcoGuidelines.calories;

    comparisonInfo.innerHTML = `
        <h2>AAFCO基準との比較</h2>
        <p>タンパク質の差: ${proteinDiff.toFixed(2)} g</p>
        <p>脂質の差: ${fatDiff.toFixed(2)} g</p>
        <p>炭水化物の差: ${carbsDiff.toFixed(2)} g</p>
        <p>カロリーの差: ${caloriesDiff.toFixed(2)} kcal</p>
    `;
}

// 栄養素不足に基づく食材レコメンド
function displayRecommendations() {
    let recommendations = [];

    if (totalNutrients.protein < aafcoGuidelines.protein) {
        recommendations.push('タンパク質を増やすには、鶏肉や魚を追加してください。');
    }
    if (totalNutrients.fat < aafcoGuidelines.fat) {
        recommendations.push('脂質を増やすには、サーモンや亜麻仁油を追加してください。');
    }
    if (totalNutrients.carbs < aafcoGuidelines.carbs) {
        recommendations.push('炭水化物を増やすには、ご飯やサツマイモを追加してください。');
    }

    recommendationInfo.innerHTML = `
        <h2>追加すべき食材の推奨</h2>
        <ul>${recommendations.map(rec => `<li>${rec}</li>`).join('')}</ul>
    `;
}
