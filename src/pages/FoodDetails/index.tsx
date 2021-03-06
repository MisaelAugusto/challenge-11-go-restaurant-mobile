import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Favorite {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  category: number;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    api.get<Favorite[]>('favorites').then(response => {
      const _favorites = response.data;

      const favoritesIds = _favorites.map(favorite => favorite.id);

      setFavorites(favoritesIds);
    });
  }, []);

  useEffect(() => {
    async function loadFood(): Promise<void> {
      api.get<Food>(`foods/${routeParams.id}`).then(response => {
        const _food = response.data;

        const parsedExtras = _food.extras.map(extra => {
          return { ...extra, quantity: 0 };
        });

        setExtras(parsedExtras);
        setIsFavorite(favorites.includes(_food.id));

        setFood({ ..._food, formattedPrice: formatValue(_food.price) });
      });
    }

    loadFood();
  }, [routeParams, favorites]);

  function handleIncrementExtra(id: number): void {
    const updatedExtras = extras.map(extra => {
      if (extra.id === id) {
        return { ...extra, quantity: extra.quantity + 1 };
      }

      return extra;
    });

    setExtras(updatedExtras);
  }

  function handleDecrementExtra(id: number): void {
    const updatedExtras = extras.map(extra => {
      if (extra.id === id && extra.quantity > 0) {
        return { ...extra, quantity: extra.quantity - 1 };
      }

      return extra;
    });

    setExtras(updatedExtras);
  }

  function handleIncrementFood(): void {
    setFoodQuantity(foodQuantity + 1);
  }

  function handleDecrementFood(): void {
    if (foodQuantity > 1) {
      setFoodQuantity(foodQuantity - 1);
    }
  }

  const toggleFavorite = useCallback(() => {
    const { id, name, description, price, category, image_url } = food;

    const lastIndex = image_url.lastIndexOf('-');

    const foodIndex = Number(image_url[-5]);
    const foodImages = ['ao_molho', 'veggie', 'camarao'];

    const thumbnail_url = `${image_url.substring(
      0,
      lastIndex,
    )}-gorestaurant-mobile/${foodImages[foodIndex]}`;

    const data = {
      id,
      name,
      description,
      price,
      category,
      image_url,
      thumbnail_url,
    };

    setIsFavorite(!isFavorite);

    try {
      if (isFavorite) {
        api.post('favorites', data);
      } else {
        api.delete(`favorites/${id}`);
      }
    } catch (err) {
      console.log(err);
    }
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    const extrasPrice = extras.reduce(
      (total, extra) => extra.value * extra.quantity + total,
      0,
    );

    const foodPrice = food.price * foodQuantity;

    return formatValue(extrasPrice + foodPrice);
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    const {
      name,
      description,
      price,
      formattedPrice,
      category,
      image_url: thumbnail_url,
      extras: _extras,
    } = food;

    const data = {
      product_id: food.id,
      name,
      description,
      price,
      category,
      formattedPrice,
      thumbnail_url,
      extras: _extras,
    };

    await api.post('orders', data);
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
