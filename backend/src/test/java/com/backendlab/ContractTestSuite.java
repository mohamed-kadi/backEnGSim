package com.backendlab;

import com.backendlab.app.User;
import com.backendlab.app.UserRepository;
import com.backendlab.learning.LearningNoteRepository;
import io.restassured.RestAssured;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class ContractTestSuite {

    @LocalServerPort
    private int port;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LearningNoteRepository learningNoteRepository;

    private Long testUserId;

    @BeforeEach
    public void setup() {
        RestAssured.port = port;

        // Reset before touching repositories so fault-injection aspects cannot leak between tests.
        given().post("/api/_system/scenario/reset").then().statusCode(200);
        
        // Seed the database with a test user
        User user = new User("contract_tester", "tester@example.com");
        user = userRepository.save(user);
        testUserId = user.getId();
    }

    @AfterEach
    public void cleanup() {
        given().post("/api/_system/scenario/reset").then().statusCode(200);
        userRepository.deleteAll();
        learningNoteRepository.deleteAll();
        given().post("/api/_system/scenario/reset").then().statusCode(200);
    }

    @Test
    public void testNormalBehavior_ReturnsFullUserDto() {
        given().pathParam("id", testUserId)
            .when().get("/api/users/{id}")
            .then().statusCode(200)
            .body("username", equalTo("contract_tester"))
            .body("email", equalTo("tester@example.com")); // Contract guarantees email is present
    }

    @Test
    public void testDtoRegressionScenario_BreaksContractByDroppingEmail() {
        // 1. Activate the incident via our ScenarioController
        given().pathParam("id", "01-dto-regression")
            .when().post("/api/_system/scenario/activate/{id}")
            .then().statusCode(200).body("status", equalTo("activated"));

        // 2. Fetch the user and verify the incident successfully broke the contract (email is null)
        given().pathParam("id", testUserId)
            .when().get("/api/users/{id}")
            .then().statusCode(200)
            .body("username", equalTo("contract_tester"))
            .body("email", nullValue()); // The fault aspect successfully stripped the email
    }

    @Test
    public void testApiLatencyScenario_AddsDelay() {
        // 1. Activate the latency incident
        given().pathParam("id", "02-api-latency")
            .when().post("/api/_system/scenario/activate/{id}")
            .then().statusCode(200);

        long startTime = System.currentTimeMillis();
        
        // 2. Fetch the user and measure the execution time
        given().pathParam("id", testUserId)
            .when().get("/api/users/{id}")
            .then().statusCode(200);
            
        long duration = System.currentTimeMillis() - startTime;
        assertTrue(duration >= 2900, "Response should take at least 3 seconds due to injected latency");
    }

    @Test
    public void testDatabaseConnectionScenario_Throws500Error() {
        // 1. Activate the db connection incident
        given().pathParam("id", "03-db-connection")
            .when().post("/api/_system/scenario/activate/{id}")
            .then().statusCode(200);

        // 2. Fetch the user and verify it fails with a 500 Internal Server Error
        given().pathParam("id", testUserId)
            .when().get("/api/users/{id}")
            .then().statusCode(500);
    }

    @Test
    public void testCacheStampedeScenario_CausesTimeoutAndError() {
        // 1. Activate the cache stampede incident
        given().pathParam("id", "04-cache-stampede")
            .when().post("/api/_system/scenario/activate/{id}")
            .then().statusCode(200);

        long startTime = System.currentTimeMillis();

        // 2. Fetch the user and verify it fails after a significant delay
        given().pathParam("id", testUserId)
            .when().get("/api/users/{id}")
            .then().statusCode(500);
            
        long duration = System.currentTimeMillis() - startTime;
        assertTrue(duration >= 4900, "Response should take at least 5 seconds due to injected cache stampede delay");
    }

    @Test
    public void testCreateUser_NormalBehavior_ReturnsCreatedUser() {
        User newUser = new User("new_user", "new@example.com");
        given().contentType("application/json")
            .body(newUser)
            .when().post("/api/users")
            .then().statusCode(200)
            .body("username", equalTo("new_user"))
            .body("id", notNullValue());
    }

    @Test
    public void testWriteFailureScenario_Throws500Error() {
        given().pathParam("id", "05-write-failure")
            .when().post("/api/_system/scenario/activate/{id}")
            .then().statusCode(200);

        User newUser = new User("new_user", "new@example.com");
        given().contentType("application/json")
            .body(newUser)
            .when().post("/api/users")
            .then().statusCode(500);
    }

    @Test
    public void testMemoryLeakScenario_AllocatesMemoryWithoutImmediateCrash() {
        given().pathParam("id", "06-memory-leak")
            .when().post("/api/_system/scenario/activate/{id}")
            .then().statusCode(200);

        // Fetch user multiple times to trigger the memory allocation multiple times
        // We do a limited loop so we don't actually crash the JVM running the tests
        for (int i = 0; i < 5; i++) {
            given().pathParam("id", testUserId)
                .when().get("/api/users/{id}")
                .then().statusCode(200);
        }
        // If the loop completes without an OutOfMemoryError, the controlled simulation works.
    }

    @Test
    public void testLearningNotes_CanBeSavedAndReadByScenario() {
        given().contentType("application/json")
            .body("""
                {
                  "notes": "DTO regression broke the response contract.",
                  "completed": true
                }
                """)
            .when().put("/api/_learning/notes/01-dto-regression")
            .then().statusCode(200)
            .body("scenarioId", equalTo("01-dto-regression"))
            .body("notes", equalTo("DTO regression broke the response contract."))
            .body("completed", equalTo(true))
            .body("updatedAt", notNullValue());

        given()
            .when().get("/api/_learning/notes/01-dto-regression")
            .then().statusCode(200)
            .body("scenarioId", equalTo("01-dto-regression"))
            .body("notes", equalTo("DTO regression broke the response contract."))
            .body("completed", equalTo(true));
    }

    @Test
    public void testLearningNotes_NormalizesBlankNotes() {
        given().contentType("application/json")
            .body("""
                {
                  "notes": "   ",
                  "completed": false
                }
                """)
            .when().put("/api/_learning/notes/01-dto-regression")
            .then().statusCode(200)
            .body("scenarioId", equalTo("01-dto-regression"))
            .body("notes", equalTo(""))
            .body("completed", equalTo(false));
    }

    @Test
    public void testLearningNotes_RejectsOversizedNotes() {
        String oversizedNotes = "x".repeat(5001);

        given().contentType("application/json")
            .body(Map.of("notes", oversizedNotes, "completed", false))
            .when().put("/api/_learning/notes/01-dto-regression")
            .then().statusCode(400)
            .body("error", equalTo("validation_failed"))
            .body("message", equalTo("notes must be 5000 characters or fewer"));
    }

    @Test
    public void testLearningNotes_RejectUnknownScenario() {
        given().contentType("application/json")
            .body("""
                {
                  "notes": "Unknown scenario",
                  "completed": false
                }
                """)
            .when().put("/api/_learning/notes/not-real")
            .then().statusCode(404);
    }
}
