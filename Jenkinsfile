// frontend/Jenkinsfile
// Build, test, and containerise the React frontend.
// ECR push stages are enabled — requires 'aws-ecr-credentials' in Jenkins credentials.

pipeline {
    agent any

    environment {
        IMAGE_NAME = 'my-s3-react-frontend'
        IMAGE_TAG  = "${env.BUILD_NUMBER ?: 'latest'}"

        // ECR configuration
        AWS_REGION    = 'us-east-1'
        ECR_REGISTRY  = '888577028066.dkr.ecr.us-east-1.amazonaws.com'
        ECR_REPO_NAME = 'vaishnavitestrepo'
        ECR_REPO      = "888577028066.dkr.ecr.us-east-1.amazonaws.com/vaishnavitestrepo"
        ECR_TAG       = 'frontend'
    }

    tools {
        nodejs 'NodeJS-20' // must match the name configured in Jenkins Global Tools
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                dir('frontend') {
                    sh 'npm ci'
                }
            }
        }

        stage('Run Tests') {
            steps {
                dir('frontend') {
                    sh 'npm test'
                }
            }
        }

        stage('Build React App') {
            steps {
                dir('frontend') {
                    // Pass the backend URL at build time if needed
                    // withEnv(["VITE_API_BASE_URL=http://your-backend-url"]) {
                    sh 'npm run build'
                    // }
                    archiveArtifacts artifacts: 'dist/**', fingerprint: true
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                dir('frontend') {
                    sh """
                        docker build \
                            --build-arg VITE_API_BASE_URL=http://backend:8080 \
                            -t ${IMAGE_NAME}:${IMAGE_TAG} \
                            -t ${IMAGE_NAME}:latest \
                            .
                    """
                }
            }
        }

        // ----------------------------------------------------------------
        // ECR Push
        // ----------------------------------------------------------------
        stage('Login to ECR') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-ecr-credentials'
                ]]) {
                    sh """
                        aws ecr get-login-password --region ${AWS_REGION} \\
                            | docker login --username AWS --password-stdin ${ECR_REGISTRY}
                    """
                }
            }
        }

        stage('Push to ECR') {
            steps {
                sh """
                    docker tag  ${IMAGE_NAME}:${IMAGE_TAG} ${ECR_REPO}:${ECR_TAG}-${IMAGE_TAG}
                    docker tag  ${IMAGE_NAME}:latest       ${ECR_REPO}:${ECR_TAG}
                    docker push ${ECR_REPO}:${ECR_TAG}-${IMAGE_TAG}
                    docker push ${ECR_REPO}:${ECR_TAG}
                """
            }
        }
    }

    post {
        success {
            echo "Frontend build succeeded. Image: ${IMAGE_NAME}:${IMAGE_TAG}"
        }
        failure {
            echo 'Frontend build FAILED. Check the logs above.'
        }
        always {
            cleanWs()
        }
    }
}
