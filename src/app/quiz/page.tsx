'use client'
import { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import classNames from 'classnames';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaArrowLeftLong } from "react-icons/fa6";

interface Anime {
    id: string;
    attributes: {
        canonicalTitle: string;
        posterImage: {
            large: string;
        };
        season: string;
    };
}

const getRandomInt = (max: number) => {
    return Math.floor(Math.random() * max);
};

// Shuffle array using Fisher-Yates algorithm
const shuffleArray = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

const AnimeQuiz = () => {
    const [animeList, setAnimeList] = useState<Anime[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
    const [choices, setChoices] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [loadingProgress, setLoadingProgress] = useState<number>(0); // New state for loading progress
    const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
    const [isLocked, setIsLocked] = useState<boolean>(false);
    const [showCorrect, setShowCorrect] = useState<boolean>(false);
    const [isImageLoaded, setIsImageLoaded] = useState<boolean>(false);
    const [isQuizReady, setIsQuizReady] = useState<boolean>(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const subtype = searchParams.get('subtype') || 'TV';
    const year = searchParams.get('year') || '2024';
    const season = searchParams.get('season') || 'winter';

    useEffect(() => {
        const fetchAllAnimeData = async () => {
            let allAnime: Anime[] = [];
            let page = 0;
            let hasMore = true;

            // Fetch the total count of anime
            const initialResponse = await fetch(
                `https://kitsu.io/api/edge/anime?filter[seasonYear]=${year}&filter[season]=${season}&filter[subtype]=${subtype}&page[limit]=1`
            );
            const initialData = await initialResponse.json();
            const totalCount = initialData.meta.count;
            const pageLimit = 20;
            const totalPages = Math.ceil(totalCount / pageLimit);

            while (hasMore) {
                const response = await fetch(
                    `https://kitsu.io/api/edge/anime?filter[seasonYear]=${year}&filter[season]=${season}&filter[subtype]=${subtype}&page[limit]=${pageLimit}&page[offset]=${page * pageLimit}`
                );
                const data = await response.json();
                if (data.data.length === 0) {
                    hasMore = false;
                } else {
                    allAnime = allAnime.concat(data.data);
                    page++;
                    const progress = Number(Number((Math.min((page / totalPages) * 100, 100))).toFixed(2));
                    setLoadingProgress(progress); // Update loading progress
                }
            }

            setAnimeList(shuffleArray(allAnime)); // Shuffle the list after fetching
            setLoading(false);
        };

        fetchAllAnimeData();
    }, []);

    useEffect(() => {
        if (!loading && animeList.length > 0) {
            const currentAnime = animeList[currentQuestionIndex];
            const filteredAnimeList = animeList.filter(
                (anime) => anime.attributes.canonicalTitle !== currentAnime.attributes.canonicalTitle
            );
            const randomChoices: string[] = [];

            while (randomChoices.length < 3) {
                const randomIndex = getRandomInt(filteredAnimeList.length);
                const randomAnime = filteredAnimeList[randomIndex];
                if (!randomChoices.includes(randomAnime.attributes.canonicalTitle)) {
                    randomChoices.push(randomAnime.attributes.canonicalTitle);
                }
            }
            randomChoices.push(currentAnime.attributes.canonicalTitle);
            setChoices(shuffleArray(randomChoices));
            setIsImageLoaded(false);
            setIsQuizReady(true);
        }
    }, [currentQuestionIndex, loading, animeList]);

    const handleChoiceClick = (choice: string) => {
        if (!isLocked) {
            setSelectedChoice(choice);
            setIsLocked(true);

            // Check if the choice is correct or not
            if (choice !== animeList[currentQuestionIndex].attributes.canonicalTitle) {
                setShowCorrect(true); // Show the correct answer
            }

            setTimeout(() => {
                if (currentQuestionIndex < animeList.length - 1) {
                    setCurrentQuestionIndex(currentQuestionIndex + 1);
                } else {
                    // Shuffle the anime list and restart the quiz
                    setAnimeList(shuffleArray([...animeList]));
                    setCurrentQuestionIndex(0);
                }
                setSelectedChoice(null);
                setIsLocked(false);
                setShowCorrect(false);
            }, 3000); // 3 seconds delay
        }
    };

    const handleImageLoad = () => {
        setIsImageLoaded(true); // Set to true when the image has loaded
    };

    return (
        <div className="w-screen h-screen bg-black p-4 flex items-center justify-center">
            <nav className="bg-black fixed w-full top-0 z-10">
                <div className="bg-zinc-800 text-sm font-bold py-2 mb-3 container mx-auto flex items-center justify-center relative">
                    <FaArrowLeftLong
                        className="absolute text-white text-2xl left-0 flex items-center ml-4 cursor-pointer"
                        onClick={() => router.back()}
                    />
                    <h1 className={"text-white text-lg"}>TomiSakae</h1>
                </div>
            </nav>
            {loading ? (
                <div className='flex flex-col justify-center items-center'>
                    <p className="font-bold text-lg mb-2 text-white">Trắc Nghiệm Anime</p>
                    <div className='border border-white rounded-full w-[90vw]'>
                        <div
                            className="bg-green-500 h-4 rounded-full transition-all duration-500 ease-linear"
                            style={{ width: `${loadingProgress}%` }}
                        ></div>
                    </div>
                    <p className="text-white">{loadingProgress}%</p>
                </div>
            ) : (
                animeList.length > 0 && (
                    <div className="text-center text-white">
                        <p className="font-bold text-xl mb-4">Trắc Nghiệm Anime</p>
                        <div
                            className={classNames(
                                'relative w-48 h-auto mx-auto rounded-md transition duration-500 ease-in-out',
                                {
                                    'blur-lg opacity-50': !isImageLoaded,
                                    'blur-0 opacity-100': isImageLoaded,
                                }
                            )}
                        >
                            <Image
                                src={animeList[currentQuestionIndex].attributes.posterImage.large}
                                alt={animeList[currentQuestionIndex].attributes.canonicalTitle}
                                width={550}
                                height={780}
                                className="w-full h-auto rounded-md"
                                onLoad={handleImageLoad}
                            />
                        </div>
                        {isImageLoaded && isQuizReady && (
                            <div className="grid grid-cols-1 mt-6 h-[35vh] overflow-y-auto">
                                {choices.map((choice, index) => (
                                    <button
                                        key={index}
                                        className={classNames(
                                            'text-white p-2 my-2 rounded-md border border-white',
                                            {
                                                'bg-green-500':
                                                    (selectedChoice === choice && choice === animeList[currentQuestionIndex].attributes.canonicalTitle) ||
                                                    (showCorrect && choice === animeList[currentQuestionIndex].attributes.canonicalTitle),
                                                'bg-red-500': selectedChoice === choice && choice !== animeList[currentQuestionIndex].attributes.canonicalTitle,
                                                'cursor-not-allowed': isLocked,
                                            }
                                        )}
                                        onClick={() => handleChoiceClick(choice)}
                                        disabled={isLocked}
                                    >
                                        {choice}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )
            )}
        </div>
    );
};

const Quiz = () => {
    return (
        <Suspense>
            <AnimeQuiz />
        </Suspense>
    );
}

export default Quiz;
